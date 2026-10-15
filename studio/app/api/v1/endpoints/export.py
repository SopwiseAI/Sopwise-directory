"""导出端点。

导出是【写操作】——它会往磁盘落 topics-{env}.json / tools-{env}.json,
所以和 POST/PUT/DELETE 一样要求 API Key:这个接口能覆盖前端的整个数据源。
"""

from fastapi import APIRouter, Depends

from app.core.deps import DbSession
from app.core.security import require_write
from app.exporters.json_exporter import export_to_json
from app.schemas.common import ExportResponse

router = APIRouter()


@router.post("/export", response_model=ExportResponse, dependencies=[Depends(require_write)])
async def export_data(db: DbSession) -> ExportResponse:
    """按 schema.sql 的【导出投影】重新生成数据文件。

    这里刻意不吞异常: 导出失败(库读不到、目录不可写)必须让调用方看到失败,
    否则前端会继续用上一次的旧数据却以为同步成功了。异常交给 main.py 的
    全局处理器, 日志里带 X-Request-ID 可以回溯。
    文件写入本身是原子的(先写临时文件再 os.replace), 失败不会留下半个 JSON。
    """
    return await export_to_json(db)
