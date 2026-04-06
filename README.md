# 网球少女养成游戏

一款纯前端网页模拟养成游戏，玩家扮演一名 12 岁网球少女，通过训练、参赛、社交，逐步走向职业赛场。

无需服务器，打开即玩。可部署到 GitHub Pages。

## 游戏特色

- **角色创建** — 自定义姓名 + 选择打法风格（灵巧战术 / 底线力量 / 跑动防守）
- **月度计划** — 每月四周，拖拽分配训练、休息、参赛，体力实时校验
- **四大赛事体系** — CTJ 青少年 → ITF Junior → ITF → WTA，按年龄逐步解锁
- **动态世界排名** — 100+ NPC 同步参赛涨跌，12 个月滚动积分
- **社交系统** — 与妈妈、好友、教练对话，触发剧情消息
- **新闻系统** — 按游戏内时间推送网球资讯
- **存档管理** — 3 个存档槽 + JSON 导出/导入备份

## 玩法简介

1. 创建角色，选择打法风格（影响 14 岁后的专项成长加成）
2. 每月制定四周行动计划（训练 / 休息 / 参赛）
3. 12–14 岁打 CTJ 青少年赛事，培养综合素质和智慧
4. 14 岁属性觉醒，解锁力量/技术/敏捷专项训练与高级别赛事
5. 通过手机查看消息、新闻、赛程，报名比赛
6. 随时存档，支持多周目

## 技术栈

- **纯前端 SPA** — Vanilla JS + ES Modules，零构建工具
- **UI 框架** — Bootstrap 5 + Bootstrap Icons
- **拖拽** — SortableJS
- **存储** — localStorage
- **路由** — Hash Router（`#/main`, `#/phone` 等）

## 项目结构

```
trygame/
├── index.html                  # SPA 单页入口
├── static/
│   ├── css/style.css           # 漫画风 UI 样式
│   ├── js/
│   │   ├── app.js              # 路由器 + 事件分发
│   │   ├── game-state.js       # localStorage 状态管理
│   │   ├── character.js        # TennisGirl 角色类
│   │   ├── match.js            # 比赛模拟引擎
│   │   ├── ranking.js          # 排名系统
│   │   ├── tournament.js       # 赛事系统
│   │   ├── social.js           # 社交系统
│   │   ├── news.js             # 新闻系统
│   │   └── pages/
│   │       ├── create.js       # 角色创建页
│   │       ├── main-page.js    # 主界面 + 行程安排
│   │       ├── phone.js        # 手机桌面
│   │       ├── calendar.js     # 赛事日历
│   │       ├── registration.js # 赛事报名
│   │       ├── ranking-page.js # 排名展示
│   │       ├── messages.js     # 消息列表
│   │       ├── chat-detail.js  # 聊天详情
│   │       ├── news-page.js    # 新闻列表 + 详情
│   │       └── save-page.js    # 存档管理
│   ├── data/                   # 赛事/新闻/消息 JSON 数据
│   └── images/                 # 图片资源
```
