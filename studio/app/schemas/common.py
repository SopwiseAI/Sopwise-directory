from datetime import datetime

from pydantic import BaseModel, Field

from app.core.config import AppEnv


class EnvResponse(BaseModel):
    env: AppEnv
    debug: bool


class HealthResponse(BaseModel):
    status: str
    database: str
    brand: str
    version: str


class ExportResponse(BaseModel):
    """导出结果。字段名与 studio/schema/*.data.jsonc 的实体名保持一致。"""

    exported_at: datetime
    # 只有文件名, 不回服务端绝对路径: 响应会进 CI 日志/前端控制台, 不该暴露部署布局
    output_path: str
    topics_count: int
    tools_count: int
    app_env: AppEnv
    synced_frontend: bool
    # 被跳过的行数。导出物少行不能只留在服务端日志里 —— 调用方(CI/运维)看响应就能
    # 判断这次导出干不干净; skipped_reasons 说明每类原因各跳过多少行
    skipped_count: int = 0
    skipped_reasons: dict[str, int] = Field(default_factory=dict)
