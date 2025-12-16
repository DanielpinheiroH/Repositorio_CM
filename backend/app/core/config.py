from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://painel_projetos_especiais_user:MewImBnoF5r0Y3GmWHt63qIEJF9K2Ezs@dpg-d2mqg41r0fns73bh51m0-a.oregon-postgres.render.com/painel_projetos_especiais"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def cors_list(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]


settings = Settings()
