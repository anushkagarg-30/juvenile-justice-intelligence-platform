"""In-memory + optional DB cache for query embeddings (search path only)."""

from __future__ import annotations

import hashlib
from collections import OrderedDict
from threading import Lock

from sqlalchemy import text

from app.config import settings
from app.database import AsyncSessionLocal


class QueryEmbeddingCache:
    def __init__(self) -> None:
        self._memory: OrderedDict[str, list[float]] = OrderedDict()
        self._lock = Lock()
        self.hits = 0
        self.misses = 0

    @property
    def enabled(self) -> bool:
        return settings.embedding_cache_enabled

    @property
    def use_db(self) -> bool:
        return settings.embedding_cache_db and bool(settings.database_url)

    def cache_key(self, text: str) -> str:
        payload = f"{settings.embedding_provider}|{settings.embedding_model}|{settings.embedding_dimensions}|{text}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def get_memory(self, key: str) -> list[float] | None:
        with self._lock:
            if key not in self._memory:
                return None
            self._memory.move_to_end(key)
            return self._memory[key]

    def set_memory(self, key: str, embedding: list[float]) -> None:
        with self._lock:
            self._memory[key] = embedding
            self._memory.move_to_end(key)
            while len(self._memory) > settings.embedding_cache_max_entries:
                self._memory.popitem(last=False)

    async def get_db(self, key: str) -> list[float] | None:
        if not self.use_db:
            return None
        try:
            async with AsyncSessionLocal() as session:
                row = (
                    await session.execute(
                        text("""
                            SELECT embedding::text AS embedding
                            FROM query_embedding_cache
                            WHERE cache_key = :key
                        """),
                        {"key": key},
                    )
                ).mappings().first()

                if not row:
                    return None

                await session.execute(
                    text("""
                        UPDATE query_embedding_cache
                        SET hit_count = hit_count + 1, last_hit_at = now()
                        WHERE cache_key = :key
                    """),
                    {"key": key},
                )
                await session.commit()
                return _parse_vector_literal(row["embedding"])
        except Exception:
            return None

    async def set_db(self, key: str, search_text: str, embedding: list[float]) -> None:
        if not self.use_db:
            return
        literal = "[" + ",".join(str(v) for v in embedding) + "]"
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(
                    text("""
                        INSERT INTO query_embedding_cache (cache_key, search_text, embedding, model)
                        VALUES (:key, :search_text, CAST(:embedding AS vector), :model)
                        ON CONFLICT (cache_key) DO UPDATE
                        SET embedding = EXCLUDED.embedding,
                            search_text = EXCLUDED.search_text,
                            model = EXCLUDED.model,
                            last_hit_at = now()
                    """),
                    {
                        "key": key,
                        "search_text": search_text[:4000],
                        "embedding": literal,
                        "model": settings.embedding_model,
                    },
                )
                await session.commit()
        except Exception:
            pass

    async def get_or_embed(
        self,
        search_text: str,
        embed_fn,
    ) -> tuple[list[float], bool]:
        """Return (embedding, cache_hit)."""
        if not self.enabled:
            return await embed_fn(search_text), False

        key = self.cache_key(search_text)
        cached = self.get_memory(key)
        if cached is not None:
            self.hits += 1
            return cached, True

        cached = await self.get_db(key)
        if cached is not None:
            self.set_memory(key, cached)
            self.hits += 1
            return cached, True

        embedding = await embed_fn(search_text)
        self.set_memory(key, embedding)
        await self.set_db(key, search_text, embedding)
        self.misses += 1
        return embedding, False

    @property
    def memory_size(self) -> int:
        with self._lock:
            return len(self._memory)


def _parse_vector_literal(raw: str) -> list[float]:
    inner = raw.strip()[1:-1]
    if not inner:
        return []
    return [float(part) for part in inner.split(",")]


query_embedding_cache = QueryEmbeddingCache()
