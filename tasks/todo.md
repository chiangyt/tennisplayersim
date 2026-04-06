# Flask → 纯前端 SPA 迁移 TODO

## 目标
将基于 Flask 的网球模拟游戏转为纯前端 SPA（Vanilla JS），可部署到 GitHub Pages 等静态托管。

---

## Phase 1: 核心引擎移植 ✅

- [x] 1.1 创建 `static/js/game-state.js` — 状态管理 + localStorage 持久化
- [x] 1.2 创建 `static/js/character.js` — 移植 TennisGirl 类（从 create_character.py）
- [x] 1.3 创建 `static/js/match.js` — 移植比赛模拟（从 simulate_match.py）
- [x] 1.4 创建 `static/js/ranking.js` — 移植排名系统（从 ranking_system.py）
- [x] 1.5 创建 `static/js/tournament.js` — 移植赛事系统（从 tournament_system.py）
- [x] 1.6 创建 `static/js/social.js` — 移植社交系统（从 social_manager.py）
- [x] 1.7 创建 `static/js/news.js` — 移植新闻系统（从 new.py）

## Phase 2: 路由和入口 ✅

- [x] 2.1 创建 `index.html` — 单页入口，引入 CDN 依赖（Bootstrap 5、SortableJS、Bootstrap Icons）
- [x] 2.2 创建 `static/js/app.js` — hash 路由器 + 启动时加载 JSON 数据 + 事件分发

## Phase 3: 页面渲染（Jinja2 → JS 模板字符串）✅

- [x] 3.1 创建 `pages/create.js` — 角色创建页
- [x] 3.2 创建 `pages/main-page.js` — 主界面 + 排程/属性弹窗
- [x] 3.3 创建 `pages/phone.js` — 手机桌面
- [x] 3.4 创建 `pages/calendar.js` — 赛事日历（4个 Tab）
- [x] 3.5 创建 `pages/registration.js` — 赛事报名
- [x] 3.6 创建 `pages/ranking-page.js` — 排名展示
- [x] 3.7 创建 `pages/messages.js` — 消息列表
- [x] 3.8 创建 `pages/chat-detail.js` — 聊天详情
- [x] 3.9 创建 `pages/news-page.js` — 新闻列表 + 详情
- [x] 3.10 创建 `pages/save-page.js` — 存档管理

## Phase 4: 整合和适配 ✅

- [x] 4.1 适配拖拽排程逻辑 — sendPlan() 改为调用 JS 引擎（集成到 app.js 中）
- [x] 4.2 逐模块检查 — import/export 路径和 API 接口已对齐
- [x] 4.3 端到端联调 — Playwright 自动化测试全部通过

## Phase 5: 收尾 ✅

- [x] 5.1 添加"导出存档"/"导入存档"按钮（防止 localStorage 丢档）
- [x] 5.2 全流程测试：创建角色 → 训练 → 排名 → 消息 → 存档/读档 — 全部通过
- [ ] 5.3 清理旧的 Python 文件和 templates 目录（待用户确认）

---

## 测试结果（Playwright 自动化）
- 创建角色页面：✅ 正常渲染，零 JS 错误
- 主界面：✅ 状态栏、日志、角色精灵、三按钮菜单
- 行程排程：✅ 拖拽/点击填充槽位、体力校验、执行后状态更新
- 手机桌面：✅ 7个 App 图标、未读数角标
- 赛事日历：✅ 4个 Tab 切换正常
- 排名系统：✅ CTJ-U14 + WTA 双 Tab，动态排名
- 消息系统：✅ 3个联系人、未读标记
- 新闻列表：✅ 按年月过滤显示
- 存档管理：✅ 3个存档槽 + 导出/导入

## 文件清单
```
index.html                          <- 新增：SPA 入口
static/js/app.js                    <- 新增：路由器 + 事件分发
static/js/game-state.js             <- 新增：localStorage 状态管理
static/js/character.js              <- 新增：TennisGirl 类（JS 版）
static/js/match.js                  <- 新增：比赛模拟引擎
static/js/ranking.js                <- 新增：排名系统
static/js/tournament.js             <- 新增：赛事系统
static/js/social.js                 <- 新增：社交系统
static/js/news.js                   <- 新增：新闻系统
static/js/pages/create.js           <- 新增：创建角色页
static/js/pages/main-page.js        <- 新增：主界面
static/js/pages/phone.js            <- 新增：手机桌面
static/js/pages/calendar.js         <- 新增：赛事日历
static/js/pages/registration.js     <- 新增：赛事报名
static/js/pages/ranking-page.js     <- 新增：排名展示
static/js/pages/messages.js         <- 新增：消息列表
static/js/pages/chat-detail.js      <- 新增：聊天详情
static/js/pages/news-page.js        <- 新增：新闻列表+详情
static/js/pages/save-page.js        <- 新增：存档管理
```
