import asyncio

from openai import AsyncOpenAI

from app.config import settings
from app.services.query_embedding_cache import query_embedding_cache


class EmbeddingService:
    def __init__(self) -> None:
        self._openai: AsyncOpenAI | None = None
        self._google_client = None

        if settings.embedding_provider == "openai" and settings.openai_api_key:
            self._openai = AsyncOpenAI(api_key=settings.openai_api_key)
        elif settings.embedding_provider == "google" and settings.google_api_key:
            from google import genai

            self._google_client = genai.Client(api_key=settings.google_api_key)

    @property
    def is_configured(self) -> bool:
        return settings.embedding_configured

    async def embed_text(self, text: str) -> list[float]:
        embeddings = await self.embed_batch([text])
        return embeddings[0]

    async def embed_query(self, text: str) -> tuple[list[float], bool]:
        """Embed search query text with optional cache (API search path only)."""
        return await query_embedding_cache.get_or_embed(text, self.embed_text)

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        if not self.is_configured:
            key_name = "GOOGLE_API_KEY" if settings.embedding_provider == "google" else "OPENAI_API_KEY"
            raise RuntimeError(f"{key_name} is not configured")

        if settings.embedding_provider == "google":
            return await self._embed_google(texts)
        return await self._embed_openai(texts)

    async def _embed_openai(self, texts: list[str]) -> list[list[float]]:
        if not self._openai:
            raise RuntimeError("OPENAI_API_KEY is not configured")

        response = await self._openai.embeddings.create(
            model=settings.embedding_model,
            input=texts,
            dimensions=settings.embedding_dimensions,
        )
        return [item.embedding for item in sorted(response.data, key=lambda d: d.index)]

    async def _embed_google(self, texts: list[str]) -> list[list[float]]:
        if not self._google_client:
            raise RuntimeError("GOOGLE_API_KEY is not configured")

        from google.genai import types
        from google.genai.errors import ClientError, ServerError

        max_retries = 6
        retryable = {429, 500, 503}
        for attempt in range(max_retries):
            try:
                return await asyncio.to_thread(self._google_embed_call, texts, types)
            except (ClientError, ServerError) as exc:
                status = getattr(exc, "status_code", None)
                if status in retryable and attempt < max_retries - 1:
                    wait_seconds = 30 * (attempt + 1)
                    print(
                        f"  Google embedding {status} — waiting {wait_seconds}s "
                        f"before retry ({attempt + 1}/{max_retries - 1})..."
                    )
                    await asyncio.sleep(wait_seconds)
                    continue
                raise

        raise RuntimeError("Google embedding failed after retries")

    def _google_embed_call(self, texts: list[str], types) -> list[list[float]]:
        result = self._google_client.models.embed_content(
            model=settings.embedding_model,
            contents=texts,
            config=types.EmbedContentConfig(
                output_dimensionality=settings.embedding_dimensions,
            ),
        )
        return [list(e.values) for e in result.embeddings]


embedding_service = EmbeddingService()
