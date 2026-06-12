import asyncio

from app.config import settings

# Models that support generateContent on the Gemini API
FALLBACK_LLM_MODELS = [
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
]

SKIP_MODEL_CODES = {404, 429, 503}


class LLMService:
    def __init__(self) -> None:
        self._google_client = None
        if settings.google_api_key:
            from google import genai

            self._google_client = genai.Client(api_key=settings.google_api_key)

    @property
    def is_configured(self) -> bool:
        return self._google_client is not None

    def _models_to_try(self) -> list[str]:
        models = [settings.llm_model, *FALLBACK_LLM_MODELS]
        seen: set[str] = set()
        ordered: list[str] = []
        for model in models:
            if model not in seen:
                seen.add(model)
                ordered.append(model)
        return ordered

    async def generate_report(self, prompt: str) -> tuple[str, bool]:
        """Returns (report_text, used_template_fallback)."""
        if not self._google_client:
            raise RuntimeError("GOOGLE_API_KEY is not configured for report generation")

        from google.genai.errors import ClientError

        last_error: Exception | None = None
        for model in self._models_to_try():
            for attempt in range(3):
                try:
                    text = await asyncio.to_thread(self._generate, model, prompt)
                    if text.strip():
                        return text, False
                except ClientError as exc:
                    last_error = exc
                    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)

                    if code == 404:
                        print(f"  Model not available ({model}) — trying next...")
                        break

                    if code in {429, 503} and attempt < 2:
                        wait = 10 * (attempt + 1) if code == 503 else 30 * (attempt + 1)
                        print(f"  LLM busy ({model}, {code}) — waiting {wait}s...")
                        await asyncio.sleep(wait)
                        continue

                    if code in {429, 503}:
                        break

                    raise

        if last_error:
            raise last_error
        raise RuntimeError("LLM returned empty response")

    def _generate(self, model: str, prompt: str) -> str:
        response = self._google_client.models.generate_content(
            model=model,
            contents=prompt,
        )
        return response.text or ""


llm_service = LLMService()
