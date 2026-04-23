const _SYS_ORDER = ['CTJ', 'ITF_Junior', 'ITF', 'WTA'];
const _SYS_LABELS = {
    CTJ: 'CTJ 青少年',
    ITF_Junior: 'ITF Junior',
    ITF: 'ITF 职业',
    WTA: 'WTA 职业',
};

function _renderMatchCard(player, match, targetMonth) {
    const bookedEvent = player.scheduled_tournaments ? player.scheduled_tournaments[String(targetMonth)] : null;
    const isAlreadySigned = bookedEvent && bookedEvent.id === match.id;
    const isTaken = bookedEvent && !isAlreadySigned;
    const isItfOrWta = match.system_tag === 'ITF' || match.system_tag === 'WTA';

    let isLocked = false;
    if (match.entry_points !== undefined) {
        isLocked = (player.ranking_points || 0) < match.entry_points;
    } else if (!isItfOrWta) {
        isLocked = (player.general_stats || 0) < (match.req_stats || 0);
    }
    // ITF / WTA 已在 getEventsForPlayer 按排名/积分过滤，进到这里均可报名

    const cardClass = isAlreadySigned ? 'registered-match' : ((isLocked || isTaken) ? 'locked-match' : 'active-match');
    const btnClass = isAlreadySigned ? 'registered' : ((isLocked || isTaken) ? 'locked' : 'active');
    const isDisabled = isLocked || isAlreadySigned || isTaken;

    let thresholdLabel = '';
    if (match.entry_points !== undefined) {
        thresholdLabel = `积分门槛: ${match.entry_points}`;
    } else if (match.system_tag === 'WTA') {
        thresholdLabel = `排名要求: 世界前 ${match.req_ranking}`;
    } else if (match.system_tag === 'ITF') {
        thresholdLabel = `积分准入: ${match.req_ranking > 0 ? match.req_ranking + ' pts' : '无门槛'}`;
    } else {
        thresholdLabel = `能力门槛: ${match.req_stats ?? '—'}`;
    }

    let actionLabel = '';
    if (isAlreadySigned) {
        actionLabel = `<i class="bi bi-check-circle-fill"></i> 已报名`;
    } else if (isTaken) {
        actionLabel = `<i class="bi bi-slash-circle"></i> 本月已报名`;
    } else if (isLocked) {
        actionLabel = `<i class="bi bi-lock-fill"></i> 锁定`;
    } else {
        actionLabel = `立即报名 <i class="bi bi-chevron-right"></i>`;
    }

    return `
    <div class="match-box shadow-sm mb-4 ${cardClass}">
        <div class="p-3 border-bottom">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <span class="fw-bold">${match.name}</span>
                    <div class="text-muted small">等级：${match.level_code} | 地点：${match.location}</div>
                </div>
                ${isAlreadySigned
                    ? `<span class="badge bg-primary">已预定</span>`
                    : `<span class="points-badge">最高积分 +${match.points[match.points.length - 1]}</span>`
                }
            </div>
        </div>
        <div class="p-3">
            <form class="register-form" data-tournament-id="${match.id}">
                <input type="hidden" name="tournament_id" value="${match.id}">
                <button type="submit"
                        class="btn btn-reg w-100 d-flex justify-content-between align-items-center ${btnClass}"
                        ${isDisabled ? 'disabled' : ''}>
                    <span>${thresholdLabel}</span>
                    <span class="fw-bold">${actionLabel}</span>
                </button>
            </form>
        </div>
    </div>`;
}

export function render(player, currentMatches, targetMonth) {
    const groups = {};
    for (const match of (currentMatches || [])) {
        const tag = match.system_tag || 'CTJ';
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(match);
    }

    const activeTabs = _SYS_ORDER.filter(t => groups[t] && groups[t].length > 0);

    let tabNavHtml = '';
    let tabContentsHtml = '';

    if (activeTabs.length === 0) {
        tabContentsHtml = `<div class="log-item text-center py-5 text-muted fw-bold">本月暂无可报名赛事</div>`;
    } else {
        tabNavHtml = activeTabs.map(tab =>
            `<div class="tab-item reg-tab-item" id="reg-tab-${tab}" onclick="switchRegTab('${tab}')">${_SYS_LABELS[tab]}</div>`
        ).join('');

        tabContentsHtml = activeTabs.map(tab =>
            `<div id="reg-view-${tab}" style="display:none;">
                ${groups[tab].map(m => _renderMatchCard(player, m, targetMonth)).join('')}
            </div>`
        ).join('');
    }

    return `
    <style>
        .reg-tab-nav {
            display: flex;
            border-bottom: 3px solid #000;
            background: #fff;
            position: sticky;
            top: 0;
            z-index: 10;
            flex-shrink: 0;
        }
        .reg-tab-item {
            flex: 1;
            text-align: center;
            padding: 12px 6px;
            font-weight: 900;
            font-size: 13px;
            cursor: pointer;
            border-right: 2px solid #000;
        }
        .reg-tab-item:last-child { border-right: none; }
        .reg-tab-item.active { background: #000; color: #fff; }
    </style>
    <div class="reg-header d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
            <a href="#/phone" class="text-dark me-3" style="text-decoration:none;">
                <i class="bi bi-chevron-left fs-4" style="-webkit-text-stroke: 1px black;"></i>
            </a>
            <h5 class="mb-0 fw-bold">赛事报名</h5>
        </div>
    </div>
    ${tabNavHtml ? `<div class="reg-tab-nav">${tabNavHtml}</div>` : ''}
    <div class="scroll-content container py-4">
        <h6 class="fw-bold mb-3 px-1">📅 正在预定：${targetMonth}月 赛事</h6>
        ${tabContentsHtml}
    </div>`;
}

export function init() {
    document.querySelectorAll('.register-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const tournamentId = form.getAttribute('data-tournament-id');
            window.dispatchEvent(new CustomEvent('game:register', { detail: { tournamentId } }));
        });
    });

    window.switchRegTab = function (tab) {
        document.querySelectorAll('[id^="reg-view-"]').forEach(el => { el.style.display = 'none'; });
        document.querySelectorAll('.reg-tab-item').forEach(el => { el.classList.remove('active'); });
        const view = document.getElementById(`reg-view-${tab}`);
        const tabEl = document.getElementById(`reg-tab-${tab}`);
        if (view) view.style.display = 'block';
        if (tabEl) tabEl.classList.add('active');
    };

    // 激活第一个 tab
    const firstTab = document.querySelector('.reg-tab-item');
    if (firstTab) {
        const tab = firstTab.id.replace('reg-tab-', '');
        window.switchRegTab(tab);
    }
}
