"""端点包 —— 一条必须遵守的约定: 返回类型标注写 ORM 类型, 不写 *Response。

端点函数【返回的是 ORM 实例】, 由 FastAPI 按装饰器上的 response_model 校验并序列化
(显式传了 response_model, 它就优先于返回标注, 所以 OpenAPI 契约仍由 *Response 决定)。

标成 *Response 读起来更"整齐", 但那是假的: 类型检查器会因此认为函数返回的就是响应
模型, 于是 app/models 上那几个非列字段(topics / topic_ids / primary_topic_id /
tool_count)再也得不到检查 —— 而它们正是最容易写漏的东西。mypy 现在能盯着这条链。
"""
