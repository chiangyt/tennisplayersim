export function render(player, breakingNews = false) {
    const gainFactors = _initGainFactors(player.playstyle);
    const isRegistered = !!(player.scheduled_tournaments && player.scheduled_tournaments[String(player.month)]);
    const currentEvent = player.scheduled_tournaments ? player.scheduled_tournaments[String(player.month)] : null;
    const stamina = Math.max(0, Math.min(100, Number.isFinite(player.stamina) ? player.stamina : 100));
    const mood = Math.max(0, Math.min(100, Number.isFinite(player.mood) ? player.mood : 100));
    const breakingBanner = breakingNews ? `
    <div class="breaking-news-banner" onclick="location.hash='#/news'">
        📰 好像有重大新闻，快去看看吧！
    </div>` : '';

    return `
    <div class="header-stats">
        <div class="d-flex justify-content-between align-items-center mb-1">
            <div class="fw-bold">📅 ${player.year}年 ${player.month}月 <span style="background:var(--color-yellow); border:2px solid #000; padding:2px 6px; border-radius:5px; font-size:0.75rem;">${player.age} 岁</span></div>
            <div style="color: #27ae60; font-weight: 900;">💰 $${player.money.toLocaleString()}</div>
        </div>
        <div class="row g-2">
            <div class="col-6">
                <small class="fw-bold">⚡ 体力: ${stamina}/100</small>
                <div class="progress stamina-bar"><div class="progress-bar bg-success" style="width: ${stamina}%"></div></div>
            </div>
            <div class="col-6">
                <small class="fw-bold">😊 心情: ${mood}/100</small>
                <div class="progress stamina-bar"><div class="progress-bar bg-warning" style="width: ${mood}%"></div></div>
            </div>
        </div>
    </div>
    ${breakingBanner}
    <div class="story-content" id="logBox">
        ${(player.log || []).map((line, i, arr) => `
            <div class="log-item ${i === arr.length - 1 ? 'fw-bold' : 'text-muted'}">${line}</div>
        `).join('')}
        <div class="player-container">
            <img id="player-sprite" src="static/images/player.png" alt="${player.name}" style="image-rendering: pixelated; width: 80px;">
            <p style="font-weight: 900; font-size: 14px; margin-top: 5px;">${player.name}</p>
        </div>
    </div>
    <div class="footer-menu shadow">
        <button class="btn-menu" onclick="openModal('scheduleModal')">
            <span class="icon">📅</span>
            <div><span class="title">行程安排</span><span class="subtitle">规划本月四周的计划</span></div>
        </button>
        <button class="btn-menu" onclick="openModal('statsModal')">
            <span class="icon">🎾</span>
            <div><span class="title">个人信息</span><span class="subtitle">查看各项身体与技术数值</span></div>
        </button>
        <button class="btn-menu" onclick="location.hash='#/phone'">
            <span class="icon">📱</span>
            <div><span class="title">移动终端</span><span class="subtitle">比赛、新闻与社交</span></div>
        </button>
    </div>
    ${_renderScheduleModal(player, isRegistered)}
    ${_renderStatsModal(player, gainFactors)}
    `;
}

function _initGainFactors(playstyle) {
    const factors = { power: 1.0, technique: 1.0, agility: 1.0 };
    if (playstyle === '灵巧战术型') factors.technique = 1.3;
    else if (playstyle === '底线力量型') factors.power = 1.3;
    else if (playstyle === '跑动防守型') factors.agility = 1.3;
    return factors;
}

function _renderScheduleModal(player, isRegistered) {
    let actionItems = '';

    if (isRegistered) {
        actionItems += `<div class="drag-item match-item plan-action plan-action-match" data-id="play_match">🏆 参加比赛</div>`;
    }

    const gf = _initGainFactors(player.playstyle);
    const pg = (1.0 * gf.power).toFixed(1);
    const tg = (1.0 * gf.technique).toFixed(1);
    const ag = (1.0 * gf.agility).toFixed(1);
    actionItems += `
        <div class="drag-item plan-action" data-id="train_power" style="background:#ffebee; color:#c62828;">力量专项</div>
        <div class="drag-item plan-action" data-id="train_technique" style="background:#e8f5e9; color:#2e7d32;">技术专项</div>
        <div class="drag-item plan-action" data-id="train_agility" style="background:#f3e5f5; color:#7b1fa2;">敏捷专项</div>
        <div class="drag-item plan-action" data-id="train_wisdom" style="background:#fff3e0; color:#ef6c00;">录像复盘</div>
        <div class="drag-item plan-action" data-id="play_game" style="background:#e0f7fa; color:#00838f;">打游戏</div>
        <div class="drag-item plan-action" data-id="rest" style="background:#eeeeee; color:#616161;">休息</div>`;

    const helpRows = [
        ['参加比赛', '当月已报赛事', '体力 -50；按战绩获积分/奖金'],
        ['力量专项', '体力 ≥ 25', `体力 -25；力量 +${pg}`],
        ['技术专项', '体力 ≥ 25', `体力 -25；技术 +${tg}`],
        ['敏捷专项', '体力 ≥ 25', `体力 -25；敏捷 +${ag}`],
        ['录像复盘', '体力 ≥ 20', '体力 -20；智慧 +1.0'],
        ['打游戏',   '体力 ≥ 10', '体力 -10；心情 +20'],
        ['休息',     '无',         '体力 +30'],
    ].map(([n, req, gain]) => `
        <tr><td class="fw-bold">${n}</td><td>${req}</td><td>${gain}</td></tr>`).join('');
    const helpHtml = `
    <div id="planHelpOverlay" onclick="if(event.target===this)window._planHideHelp()" style="display:none;position:fixed;inset:0;z-index:9100;background:rgba(0,0,0,0.55);align-items:flex-end;justify-content:center;padding:12px;">
        <div style="background:#fff;border:3px solid #000;border-radius:14px;box-shadow:5px 5px 0 #000;width:100%;max-width:430px;padding:14px 14px 16px;max-height:80vh;overflow-y:auto;">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <h6 class="fw-bold mb-0">📋 行动一览</h6>
                <button class="btn btn-sm btn-light" style="border:2px solid #000;border-radius:8px;font-weight:900;" onclick="window._planHideHelp()">关闭</button>
            </div>
            <table class="table table-sm align-middle mb-0" style="font-size:12px;">
                <thead><tr><th>动作</th><th>需求</th><th>消耗 / 收益</th></tr></thead>
                <tbody>${helpRows}</tbody>
            </table>
        </div>
    </div>`;

    let weekSlots = '';
    for (let i = 1; i <= 4; i++) {
        weekSlots += `
        <div class="slot-row d-flex align-items-center mb-2">
            <span class="week-tag me-2" style="font-size:12px;min-width:24px;">W${i}</span>
            <div id="slot-${i}" class="target-slot" data-week="${i}"></div>
        </div>`;
    }

    return `
    <style>
        #scheduleModal .plan-action {
            flex: 0 0 calc(50% - 4px);
            text-align: center;
            padding: 8px 6px;
            font-weight: 900;
            font-size: 13px;
            border: 2px solid #000;
            border-radius: 10px;
            box-shadow: 2px 2px 0 #000;
            cursor: pointer;
            user-select: none;
        }
        #scheduleModal #actionPool { gap: 8px; }
        #scheduleModal .plan-action-match {
            background: #fff4c2 !important;
            color: #b8860b !important;
            box-shadow: 2px 2px 0 #000, 0 0 0 3px #ffeaa0 inset;
            animation: planMatchPulse 1.6s ease-in-out infinite;
        }
        @keyframes planMatchPulse {
            0%, 100% { box-shadow: 2px 2px 0 #000, 0 0 0 3px #ffeaa0 inset; }
            50%      { box-shadow: 2px 2px 0 #000, 0 0 0 3px #ffd56b inset; }
        }
        #plan-help-btn {
            border: 2px solid #000;
            background: #ffd56b;
            border-radius: 50%;
            width: 26px; height: 26px;
            font-weight: 900;
            display: inline-flex; align-items: center; justify-content: center;
            box-shadow: 2px 2px 0 #000;
            cursor: pointer;
            padding: 0;
        }
        #scheduleModal .plan-btn {
            border: 2px solid #2b2b2b;
            border-radius: 10px;
            box-shadow: 2px 2px 0 #2b2b2b;
            font-weight: 700;
            font-size: 13px;
            padding: 6px 10px;
            transition: transform 0.08s, box-shadow 0.08s;
            color: #333;
        }
        #scheduleModal .plan-btn:active:not(:disabled) {
            transform: translate(2px, 2px);
            box-shadow: 0 0 0 #2b2b2b;
        }
        #scheduleModal .plan-btn-clear  { background: #fafafa; }
        #scheduleModal .plan-btn-repeat { background: #fff7df; }
        #scheduleModal .plan-btn-exec   { background: #cfe6ff; color:#1f4f7a; }
        #scheduleModal .plan-btn-exec:not(:disabled) { font-weight: 900; }
        #scheduleModal .plan-btn-exec:disabled {
            background: #ebebeb;
            color: #999;
            box-shadow: 2px 2px 0 #b5b5b5;
            border-color: #b5b5b5;
            cursor: not-allowed;
        }
    </style>
    ${helpHtml}
    <div id="scheduleModal" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable px-2">
            <div class="modal-content" style="border-radius: 20px; max-height: 88dvh;">
                <div class="modal-header border-0 py-2 px-3 d-flex align-items-center justify-content-between">
                    <h6 class="fw-bold mb-0">🗓️ ${player.month} 月计划</h6>
                    <button id="plan-help-btn" type="button" onclick="window._planShowHelp()" title="动作说明">?</button>
                </div>
                <div class="modal-body py-2 px-3">
                    <div class="mb-2">
                        <small class="text-muted d-block mb-1" style="font-size:11px;">点击或拖拽动作到周计划：</small>
                        <div id="actionPool" class="d-flex flex-wrap">
                            ${actionItems}
                        </div>
                    </div>
                    <div class="schedule-grid">
                        ${weekSlots}
                    </div>
                    <div id="dragWarn" class="text-danger mt-1" style="display:none;font-size:12px;">⚠️ 体力不足，请安排休息！</div>
                </div>
                <div class="modal-footer border-0 flex-column py-2 px-3">
                    <div class="d-flex w-100 gap-2 mb-2">
                        <button class="plan-btn plan-btn-clear flex-grow-1" onclick="clearPlan()">🧹 清空</button>
                        <button class="plan-btn plan-btn-repeat flex-grow-1" onclick="repeatLast()">🔄 重复上月</button>
                    </div>
                    <button id="execBtn" class="plan-btn plan-btn-exec w-100" onclick="sendPlan()" disabled>确定执行</button>
                </div>
            </div>
        </div>
    </div>`;
}

function _renderStatsModal(player, gainFactors) {
    const { power, technique, agility, general_stats: generalStats } = player;
    const generalStatsMax = 240;
    const generalStatsPercent = Math.min(100, (generalStats / generalStatsMax) * 100);
    const statsContent = `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1"><span>综合能力</span><span>${generalStats.toFixed(2)}</span></div>
                <div class="progress" style="height:10px;"><div class="progress-bar bg-dark" style="width:${generalStatsPercent}%"></div></div>
                <small class="text-muted d-block mt-1" style="font-size:11px;line-height:1.5;">
                    = (力量+技术+敏捷) × 0.7 + 智慧 × 0.2 + 毅力 × 0.1
                </small>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>力量 (Power)
                        ${gainFactors.power > 1.0 ? `<span class="badge bg-light text-danger border border-danger-subtle" style="font-size: 10px;">天赋 x${gainFactors.power}</span>` : ''}
                    </span>
                    <span>${power.toFixed(2)}/100</span>
                </div>
                <div class="progress" style="height:10px;"><div class="progress-bar bg-danger" style="width:${power}%"></div></div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>技术 (Technique)
                        ${gainFactors.technique > 1.0 ? `<span class="badge bg-light text-primary border border-primary-subtle" style="font-size: 10px;">天赋 x${gainFactors.technique}</span>` : ''}
                    </span>
                    <span>${technique.toFixed(2)}/100</span>
                </div>
                <div class="progress" style="height:10px;"><div class="progress-bar bg-primary" style="width:${technique}%"></div></div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>敏捷 (Agility)
                        ${gainFactors.agility > 1.0 ? `<span class="badge bg-light text-info border border-info-subtle" style="font-size: 10px;">天赋 x${gainFactors.agility}</span>` : ''}
                    </span>
                    <span>${agility.toFixed(2)}/100</span>
                </div>
                <div class="progress" style="height:10px;"><div class="progress-bar bg-info" style="width:${agility}%"></div></div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1"><span>智慧 (Wisdom)</span><span>${player.wisdom.toFixed(2)}</span></div>
                <div class="progress" style="height:10px;"><div class="progress-bar bg-warning" style="width:${player.wisdom}%"></div></div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>毅力 (Perseverance)</span>
                    <span>${player.perseverance.toFixed(2)}/100</span>
                </div>
                <div class="progress" style="height:10px;"><div class="progress-bar bg-success" style="width:${player.perseverance}%"></div></div>
            </div>`;

    return `
    <div id="statsModal" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered px-3">
            <div class="modal-content" style="border-radius: 20px;">
                <div class="modal-header border-0 pb-0"><h5 class="fw-bold">📊 选手档案</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
                <div class="modal-body">
                    <div class="d-flex justify-content-around text-center mb-3">
                        <div><small class="text-muted">姓名</small><br><strong>${player.name}</strong></div>
                        <div><small class="text-muted">身高</small><br><strong>${player.height} cm</strong></div>
                        <div><small class="text-muted">打法</small><br><strong>${player.playstyle}</strong></div>
                    </div>
                    ${statsContent}
                </div>
            </div>
        </div>
    </div>`;
}

export function init(player) {
    const isRegistered = !!(player.scheduled_tournaments && player.scheduled_tournaments[String(player.month)]);
    const currentEvent = player.scheduled_tournaments ? player.scheduled_tournaments[String(player.month)] : null;

    // 暴露给 app.js 中的全局 sendPlan / repeatLast / validatePlan 使用
    window.PLAYER_NAME = player.name;
    window.PLAYER_STAMINA = player.stamina;
    window.HAS_REGISTRATION = isRegistered;
    window.MATCH_CATEGORY = (isRegistered && currentEvent) ? (currentEvent.name || '') : '';

    // Make openModal globally available
    window.openModal = function(id) {
        const modalEl = document.getElementById(id);
        if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    };

    // Scroll logBox to bottom
    const logBox = document.getElementById('logBox');
    if (logBox) {
        logBox.scrollTop = logBox.scrollHeight;
    }
}
