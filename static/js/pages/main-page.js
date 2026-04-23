export function render(player, breakingNews = false) {
    const gainFactors = _initGainFactors(player.playstyle);
    const isRegistered = !!(player.scheduled_tournaments && player.scheduled_tournaments[String(player.month)]);
    const currentEvent = player.scheduled_tournaments ? player.scheduled_tournaments[String(player.month)] : null;
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
                <small class="fw-bold">⚡ 体力: ${player.stamina}/100</small>
                <div class="progress stamina-bar"><div class="progress-bar bg-success" style="width: ${player.stamina}%"></div></div>
            </div>
            <div class="col-6">
                <small class="fw-bold">😊 心情: ${player.mood}/100</small>
                <div class="progress stamina-bar"><div class="progress-bar bg-warning" style="width: ${player.mood || 100}%"></div></div>
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
        actionItems += `<div class="drag-item match-item" data-id="play_match">🏆 参加比赛 (体力-50)</div>`;
    }

    if (player.age < 14) {
        actionItems += `
            <div class="drag-item" data-id="train_tennis" style="background:#e3f2fd; color:#1976d2;">🎾 网球训练（体力-25 / 综合+1.5）</div>
            <div class="drag-item" data-id="train_wisdom" style="background:#fff3e0; color:#ef6c00;">📚 录像复盘（体力-20 / 智慧+1.2）</div>`;
    } else {
        const gf = _initGainFactors(player.playstyle);
        const pg = (1.2 * gf.power).toFixed(1);
        const tg = (1.2 * gf.technique).toFixed(1);
        const ag = (1.2 * gf.agility).toFixed(1);
        actionItems += `
            <div class="drag-item" data-id="train_power" style="background:#ffebee; color:#c62828;">💪 力量专项（体力-25 / 力量+${pg}）</div>
            <div class="drag-item" data-id="train_technique" style="background:#e8f5e9; color:#2e7d32;">🎯 技术专项（体力-25 / 技术+${tg}）</div>
            <div class="drag-item" data-id="train_agility" style="background:#f3e5f5; color:#7b1fa2;">⚡ 敏捷专项（体力-25 / 敏捷+${ag}）</div>`;
    }

    actionItems += `<div class="drag-item" data-id="rest" style="background:#eeeeee; color:#616161;">💤 休息（体力+30）</div>`;

    let weekSlots = '';
    for (let i = 1; i <= 4; i++) {
        weekSlots += `
        <div class="slot-row d-flex align-items-center mb-2">
            <span class="week-tag me-2" style="font-size:12px;min-width:24px;">W${i}</span>
            <div id="slot-${i}" class="target-slot" data-week="${i}"></div>
        </div>`;
    }

    return `
    <div id="scheduleModal" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable px-2">
            <div class="modal-content" style="border-radius: 20px; max-height: 88dvh;">
                <div class="modal-header border-0 py-2 px-3"><h6 class="fw-bold mb-0">🗓️ ${player.month} 月计划</h6></div>
                <div class="modal-body py-2 px-3">
                    <div class="mb-2">
                        <small class="text-muted d-block mb-1" style="font-size:11px;">点击或拖拽动作到周计划：</small>
                        <div id="actionPool" class="d-flex flex-wrap gap-2">
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
                        <button class="btn btn-light btn-sm flex-grow-1" onclick="clearPlan()">🧹 清空</button>
                        <button class="btn btn-light btn-sm flex-grow-1" onclick="repeatLast()">🔄 重复上月</button>
                    </div>
                    <button id="execBtn" class="btn btn-primary btn-sm w-100 fw-bold" onclick="sendPlan()" disabled>确定执行</button>
                </div>
            </div>
        </div>
    </div>`;
}

function _renderStatsModal(player, gainFactors) {
    let statsContent = '';

    if (player.age < 14) {
        statsContent = `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>网球综合素质</span>
                    <span>${player.general_stats.toFixed(2)}/100</span>
                </div>
                <div class="progress" style="height:10px;"><div class="progress-bar bg-primary" style="width:${player.general_stats}%"></div></div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>智慧 (Wisdom)</span>
                    <span>${player.wisdom.toFixed(2)}/100</span>
                </div>
                <div class="progress" style="height:10px;"><div class="progress-bar bg-warning" style="width:${player.wisdom}%"></div></div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>毅力 (Perseverance)</span>
                    <span>${player.perseverance.toFixed(2)}/100</span>
                </div>
                <div class="progress" style="height:10px;"><div class="progress-bar bg-success" style="width:${player.perseverance}%"></div></div>
            </div>
            <p class="small text-muted text-center mt-3">你还在打基础，14岁后将解锁专项能力</p>`;
    } else {
        statsContent = `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>力量 (Power)
                        ${gainFactors.power > 1.0 ? `<span class="badge bg-light text-danger border border-danger-subtle" style="font-size: 10px;">天赋 x${gainFactors.power}</span>` : ''}
                    </span>
                    <span>${player.power.toFixed(2)}/100</span>
                </div>
                <div class="progress" style="height:10px;"><div class="progress-bar bg-danger" style="width:${player.power}%"></div></div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>技术 (Technique)
                        ${gainFactors.technique > 1.0 ? `<span class="badge bg-light text-primary border border-primary-subtle" style="font-size: 10px;">天赋 x${gainFactors.technique}</span>` : ''}
                    </span>
                    <span>${player.technique.toFixed(2)}/100</span>
                </div>
                <div class="progress" style="height:10px;"><div class="progress-bar bg-primary" style="width:${player.technique}%"></div></div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>敏捷 (Agility)
                        ${gainFactors.agility > 1.0 ? `<span class="badge bg-light text-info border border-info-subtle" style="font-size: 10px;">天赋 x${gainFactors.agility}</span>` : ''}
                    </span>
                    <span>${player.agility.toFixed(2)}/100</span>
                </div>
                <div class="progress" style="height:10px;"><div class="progress-bar bg-info" style="width:${player.agility}%"></div></div>
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
    }

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

    // Set global variables used by main_logic.js
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
