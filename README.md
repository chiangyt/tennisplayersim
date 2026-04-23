# 网球运动员模拟游戏

一款纯前端网页模拟养成游戏，玩家扮演一名 12 岁网球少女，通过训练、参赛、社交，逐步从 CTJ 青少年赛场走向 WTA 职业舞台。

## 游戏特色

- **角色创建** — 自定义姓名 + 选择打法风格（灵巧战术型 / 底线力量型 / 跑动防守型），打法影响 14 岁后的专项成长加成
- **月度计划** — 每月四周，拖拽分配训练、休息、参赛，体力实时校验
- **四大赛事体系** — CTJ 青少年 → ITF Junior → ITF 职业 → WTA 职业，按年龄与积分逐步解锁
- **打法克制系统** — 14 岁后对手随机为力量型/技术型/敏捷型，存在三角克制关系影响胜率
- **动态世界排名** — CTJ、ITF Junior、WTA 三套 NPC 排名每月随机涨跌，玩家积分实时插入排名
- **12 个月滚动积分** — Best-of-N 择优机制（CTJ: 8 站，ITF Jr: 8 站，ITF/WTA: 10 站/12 站）
- **社交系统** — 与妈妈、闺蜜、教练对话，选项影响心情与属性，夺冠/关键时刻触发特殊剧情
- **新手引导** — 首次开局自动触发聚光灯步骤式引导
- **存档管理** — 3 个存档槽，完整快照存储（角色 + 积分 + 社交 + 世界排名）

## 玩法简介

1. 创建角色，选择打法风格
2. 每月制定四周行动计划（训练 / 休息 / 参赛）
3. 12–13 岁打 CTJ 青少年赛事，积累综合素质
4. 13 岁起可参加 ITF Junior 国际青少年赛事
5. 14 岁属性觉醒，解锁力量/技术/敏捷专项 + 打法克制体系
6. 通过积分达标后报名 ITF 职业赛，再冲击 WTA
7. 通过手机查看消息、新闻、排名、报名赛事
8. 随时存档，支持多周目

## 技术栈

- **纯前端 SPA** — Vanilla JS ES Modules，零构建工具
- **UI 框架** — Bootstrap 5 + Bootstrap Icons
- **拖拽** — SortableJS
- **存储** — localStorage（运行状态 + 存档槽）
- **路由** — Hash Router（`#/main`、`#/phone`、`#/chat/:id` 等）

## 项目结构

```
tennisplayersim/
├── index.html                  # SPA 单页入口
├── architecture.md             # 各文件职责说明
├── static/
│   ├── css/
│   │   └── style.css           # 漫画风 UI 样式（黑边框 + 马卡龙配色）
│   ├── js/
│   │   ├── app.js              # 路由器 + 全局数据加载 + 游戏事件分发
│   │   ├── game-state.js       # localStorage 状态管理（读写/存档/读档）
│   │   ├── character.js        # TennisGirl 角色类（属性成长、执行月度计划）
│   │   ├── match.js            # 比赛模拟引擎（普通5轮 / 大满贯6轮）
│   │   ├── ranking.js          # 排名系统（滚动积分、NPC生成、世界排名估算）
│   │   ├── tournament.js       # 赛事筛选与查找
│   │   ├── social.js           # 聊天系统（对话规范化、回复处理、事件触发）
│   │   ├── news.js             # 新闻数据 + WTA 球员名字池
│   │   ├── tutorial.js         # 新手引导（聚光灯步骤式）
│   │   ├── main_logic.js       # 月度行程拖拽 UI 逻辑
│   │   └── pages/
│   │       ├── create.js       # 角色创建页
│   │       ├── main-page.js    # 主界面（状态栏 + 已报赛事）
│   │       ├── phone.js        # 虚拟手机桌面导航
│   │       ├── calendar.js     # 赛事日历
│   │       ├── registration.js # 赛事报名（CTJ/ITF Jr/ITF/WTA 分 Tab）
│   │       ├── ranking-page.js # 排名展示（多体系 + 积分明细）
│   │       ├── messages.js     # 消息列表
│   │       ├── chat-detail.js  # 聊天详情（气泡 + 图片 + 回复抽屉）
│   │       ├── news-page.js    # 新闻列表
│   │       └── save-page.js    # 存档管理
│   ├── data/
│   │   ├── ctj.json            # CTJ 青少年赛事数据
│   │   ├── itf_junior.json     # ITF Junior 赛事数据
│   │   ├── itf.json            # ITF 职业赛事数据
│   │   ├── wta.json            # WTA 赛事数据（含大满贯）
│   │   ├── messages.json       # 聊天内容模板（妈妈/闺蜜/教练）
│   │   ├── news.json           # 新闻内容库
│   │   └── save_1/2/3.json     # 存档槽
│   └── images/                 # 角色立绘 + 夺冠照片等图片资源
```
