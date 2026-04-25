`# v2.0 修复和内容扩展

## Goal
集中记录 v2.0 阶段的平衡性修复、体验修复和内容扩展方向。

## Current Fix
- 修复 14 岁后打法克制公式：克制系数基于当前轮次赛事要求值 `req_stats * difficultyFactor`，不再直接放大玩家总战力。
- 同步前端比赛引擎和旧 Python 镜像逻辑，避免公式分叉。
- 调整 WTA 准入门槛：WTA250=130、WTA500=160、WTA1000=180、GS=150。
- 大满贯使用独立胜负波动逻辑：降低基础门槛，但提高每轮随机性和爆冷空间。

## Match Formula Rules
- 玩家侧战力永远由玩家数据计算：`playerPower = (general_stats * 0.5 + wisdom * 0.4 + perseverance * 0.1) * random`。
- 14 岁后 `general_stats = power + technique + agility`，力量/技术/敏捷三项共同决定玩家基础实力。
- 对手侧战力只基于赛事门槛：`oppStat = req_stats * difficultyFactor`。
- 不再给对手额外拆分隐藏属性，不使用 `oppStat * 0.5 + oppWisdom * 0.4 + oppPerseverance * 0.1`。
- 打法克制只调整对手侧 `oppStat`，不修改玩家属性、不修改 `playerPower`。
- 当前克制实现：玩家克制对手时 `oppStat / 1.1`；玩家被克制时 `oppStat / 0.9`。
- 普通赛事对手波动：`oppPower = oppStat * random(0.95, 1.05)`。
- 大满贯对手波动：`oppPower = oppStat * random(0.82, 1.22)`，并额外给胜负差值 `random(-10, 10)`。
- 最终胜负判断统一基于：`diff = playerPower - oppPower`，大满贯为 `diff = playerPower - oppPower + random(-10, 10)`。

## Scope
- 胜负判断相关修复优先保持最小改动。
- 内容扩展按现有 SPA 架构追加页面、数据和事件，不改变核心状态流。
- 奖励、积分、社交触发等非本次问题范围的逻辑保持不动。
