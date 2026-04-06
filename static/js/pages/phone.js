export function render(player, totalUnread) {
    const unreadBadge = totalUnread > 0
        ? `<span style="position:absolute;top:-6px;right:-6px;background:#ff3b30;color:#fff;border-radius:50%;min-width:18px;height:18px;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;border:2px solid #fff;padding:0 3px;">${totalUnread < 10 ? totalUnread : '9+'}</span>`
        : '';

    return `
    <style>
        :root {
            --bg-page: #f0f0f0;
            --bg-phone: #ffffff;
            --color-cal: #ff9fb2;
            --color-reg: #ffd56b;
            --color-msg: #85e3ff;
            --color-news: #b8e994;
            --color-rank: #c5a3ff;
            --color-home: #d1d8e0;
            --border-val: 3px solid #000;
        }
        .phone-page-body {
            background-color: var(--bg-page);
            background-image: radial-gradient(#dcdcdc 1.5px, transparent 1.5px);
            background-size: 20px 20px;
            flex: 1;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            margin: 0;
            overflow: hidden;
        }
        .phone-shell {
            width: 350px;
            height: 680px;
            background: var(--bg-phone);
            border: 5px solid #000;
            border-radius: 30px;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 12px 12px 0px rgba(0,0,0,0.1);
        }
        @media (max-width: 420px) {
            .phone-page-body {
                align-items: stretch;
                justify-content: stretch;
                background-image: none;
            }
            .phone-shell {
                width: 100%;
                height: 100%;
                border-radius: 0;
                border: none;
                box-shadow: none;
            }
        }
        .status-bar {
            height: 40px;
            padding: 10px 30px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            font-weight: 900;
        }
        .phone-content {
            flex-grow: 1;
            padding: 20px;
        }
        .user-id {
            font-size: 1.1rem;
            font-weight: 900;
            margin: 10px 0 30px 5px;
            padding-bottom: 5px;
            border-bottom: 3px solid #000;
            display: inline-block;
        }
        .app-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            row-gap: 30px;
        }
        .app-item {
            text-decoration: none !important;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: transform 0.1s;
            cursor: pointer;
        }
        .app-item:active {
            transform: scale(0.9);
        }
        .app-icon {
            width: 58px;
            height: 58px;
            border: var(--border-val);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            background: #fff;
            box-shadow: 4px 4px 0px #000;
            margin-bottom: 8px;
        }
        .app-name {
            font-size: 11px;
            color: #000;
            font-weight: 900;
            letter-spacing: 0.5px;
        }
        .icon-cal  { background-color: var(--color-cal) !important; }
        .icon-reg  { background-color: var(--color-reg) !important; }
        .icon-msg  { background-color: var(--color-msg) !important; }
        .icon-news { background-color: var(--color-news) !important; }
        .icon-rank { background-color: var(--color-rank) !important; }
        .icon-home { background-color: var(--color-home) !important; }
        .home-bar {
            height: 5px;
            width: 110px;
            background: #000;
            border-radius: 10px;
            margin: 15px auto;
            opacity: 0.2;
        }
    </style>
    <div class="phone-page-body">
    <div class="phone-shell">
        <div class="status-bar">
            <span>9:41</span>
            <div style="letter-spacing: 2px;">📶 🔋</div>
        </div>
        <div class="phone-content">
            <div class="user-id">ID: ${player.name}</div>
            <div class="app-grid">
                <a href="#/calendar" class="app-item">
                    <div class="app-icon icon-cal">📅</div>
                    <span class="app-name">赛历</span>
                </a>
                <a href="#/registration" class="app-item">
                    <div class="app-icon icon-reg">📝</div>
                    <span class="app-name">报名</span>
                </a>
                <a href="#/messages" class="app-item">
                    <div class="app-icon icon-msg" style="position:relative;">
                        💬
                        ${unreadBadge}
                    </div>
                    <span class="app-name">简讯</span>
                </a>
                <a href="#/news" class="app-item">
                    <div class="app-icon icon-news">📰</div>
                    <span class="app-name">资讯</span>
                </a>
                <a href="#/ranking" class="app-item">
                    <div class="app-icon icon-rank">🏆</div>
                    <span class="app-name">排名</span>
                </a>
                <a href="#/main" class="app-item">
                    <div class="app-icon icon-home">🏠</div>
                    <span class="app-name">主页</span>
                </a>
                <a href="#/saves" class="app-item">
                    <div class="app-icon" style="background-color: #b8e994;">💾</div>
                    <span class="app-name">存档</span>
                </a>
            </div>
        </div>
        <div class="home-bar"></div>
    </div>
    </div>`;
}
