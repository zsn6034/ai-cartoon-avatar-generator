from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    qwen_api_key: str = ""
    qwen_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    qwen_model: str = "qwen-vl-plus"
    doubao_api_key: str = ""
    doubao_base_url: str = "https://ark.cn-beijing.volces.com/api/v3"
    doubao_model: str = "doubao-1-5-vision-pro-32k-250115"
    default_provider: str = "qwen"
    frontend_origin: str = "http://localhost:5173"
    frontend_origin_regex: str = r"https://.*\.vercel\.app"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_frontend_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.frontend_origin.split(",")]
        defaults = ["http://localhost:5173", "http://127.0.0.1:5173"]
        return [origin for origin in [*origins, *defaults] if origin]

    @property
    def allowed_frontend_origin_regex(self) -> str | None:
        return self.frontend_origin_regex.strip() or None


@lru_cache
def get_settings() -> Settings:
    return Settings()
