---
description: 目录总览统计
---

# 目录总览

## 执行步骤

```
!`python skills/tools/api.py stats`
```

根据统计结果，给出简要分析:

- 如果待审核产品 > 0，提示用户可使用 `/std-review` 审核
- 如果草稿产品 > 0，提示用户可使用 `/std-enrich` 补全信息
- 如果已发布产品 = 0，提示用户需要先发布产品才能导出
