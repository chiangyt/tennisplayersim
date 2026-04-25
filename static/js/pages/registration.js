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
    if (match.is_rank_locked) {
        isLocked = true;
    } else if (match.entry_points !== undefined) {
        isLocked = (player.ranking_points || 0) < match.entry_points;
    } else if (!isItfOrWta) {
        isLocked = (player.general_stats || 0) < (match.req_stats || 0);
    }

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
        .reg-help-btn {
            width: 32px; height: 32px; border-radius: 50%;
            border: 2px solid #000; background: #fff;
            display: inline-flex; align-items: center; justify-content: center;
            font-weight: 900; cursor: pointer;
            box-shadow: 2px 2px 0 #000; transition: transform 0.1s, box-shadow 0.1s;
            padding: 0;
        }
        .reg-help-btn:active { transform: translate(2px,2px); box-shadow: 0 0 0 #000; }
        .reg-help-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.55);
            z-index: 9000; display: flex; align-items: flex-end;
        }
        .reg-help-sheet {
            width: 100%; background: #fdfaf6;
            border: 3px solid #000; border-bottom: none;
            border-radius: 20px 20px 0 0;
            padding: 0 16px 28px; max-height: 78vh; overflow-y: auto;
            animation: reg-help-up 0.22s cubic-bezier(0.34,1.4,0.64,1);
        }
        @keyframes reg-help-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .reg-help-handle {
            width: 40px; height: 5px; background: #ccc; border-radius: 3px;
            margin: 12px auto 16px;
        }
        .reg-help-section {
            border: 2px solid #000; border-radius: 12px; padding: 12px 14px;
            margin-bottom: 12px; background: #fff; box-shadow: 3px 3px 0 #000;
        }
        .reg-help-section h6 { font-weight: 900; margin-bottom: 8px; font-size: 14px; }
        .reg-help-section ul { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.7; }
        .reg-help-section li strong { font-weight: 900; }
        .reg-help-close {
            display: block; width: 100%; margin-top: 8px;
            padding: 10px; font-weight: 900; font-size: 15px;
            background: #fff; border: 3px solid #000;
            border-radius: 12px; box-shadow: 4px 4px 0 #000;
            cursor: pointer; transition: transform 0.1s, box-shadow 0.1s;
        }
        .reg-help-close:active { transform: translate(3px,3px); box-shadow: 0 0 0 #000; }
    </style>
    <div class="reg-header d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
            <a href="#/phone" class="text-dark me-3" style="text-decoration:none;">
                <i class="bi bi-chevron-left fs-4" style="-webkit-text-stroke: 1px black;"></i>
            </a>
            <h5 class="mb-0 fw-bold">赛事报名</h5>
        </div>
        <button class="reg-help-btn" onclick="window._regShowHelp()" aria-label="报名规则说明">
            <i class="bi bi-question-lg"></i>
        </button>
    </div>
    ${tabNavHtml ? `<div class="reg-tab-nav">${tabNavHtml}</div>` : ''}
    <div class="scroll-content container py-4">
        <h6 class="fw-bold mb-3 px-1">📅 正在预定：${targetMonth}月 赛事</h6>
        ${tabContentsHtml}
    </div>`;
}

function _buildHelpHTML() {
    return `
    <div class="reg-help-handle"></div>
    <h5 class="fw-bold mb-3" style="letter-spacing:1px;">📖 报名规则说明</h5>

    <div class="reg-help-section">
        <h6>📅 时间规则</h6>
        <ul>
            <li>报名的是<strong>下个月</strong>的赛事，记得在行程里安排 ⚡参加比赛。</li>
            <li>每个月<strong>只能报 1 站</strong>；已报名后本月其他赛事会显示「本月已报名」。</li>
        </ul>
    </div>

    <div class="reg-help-section">
        <h6>🎂 年龄准入</h6>
        <ul>
            <li><strong>CTJ 青少年</strong>：12–16 岁（17 岁起截断）</li>
            <li><strong>ITF Junior</strong>：13–18 岁（19 岁起截断）</li>
            <li><strong>ITF 职业</strong>：14 岁起开放</li>
            <li><strong>WTA 职业</strong>：14 岁起开放</li>
        </ul>
    </div>

    <div class="reg-help-section">
        <h6>🔓 报名门槛</h6>
        <ul>
            <li><strong>CTJ</strong>：看<strong>综合能力</strong>是否达到<strong>能力门槛</strong>。</li>
            <li><strong>ITF Junior</strong>：看<strong>ITF Junior 积分</strong>是否达到<strong>积分门槛</strong>（J500 需 700 分，J300 需 350 分，逐级递减）。</li>
            <li><strong>ITF 职业</strong>：看<strong>ITF 女子积分</strong>是否达到<strong>积分准入</strong>线。</li>
            <li><strong>WTA 职业</strong>：看<strong>WTA 世界排名</strong>是否进入门槛名次内（如 WTA1000 需前 50 等）。</li>
            <li class="text-muted" style="font-size:12px;">注：ITF/WTA 卡片上的「建议能力」为 14 岁后各属性加权和，仅供参考，不作为硬门槛。</li>
        </ul>
    </div>

    <div class="reg-help-section">
        <h6>📊 积分与奖金</h6>
        <ul>
            <li>比赛进入每一轮都能获得排名积分和奖金（冠军最高）。</li>
            <li>每个体系独立维护积分池，<strong>滚动 12 个月</strong>内的最好 N 站成绩计入。</li>
            <li>具体每轮可得积分与奖金可在<strong>赛季日历</strong>点击赛事查看。</li>
        </ul>
    </div>

    <button class="reg-help-close" onclick="window._regCloseHelp()">知道了</button>`;
}

export function init() {
    document.querySelectorAll('.register-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const tournamentId = form.getAttribute('data-tournament-id');
            window.dispatchEvent(new CustomEvent('game:register', { detail: { tournamentId } }));
        });
    });

    window._regShowHelp = function () {
        const existing = document.getElementById('reg-help-overlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.id = 'reg-help-overlay';
        overlay.className = 'reg-help-overlay';
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) window._regCloseHelp();
        });
        const sheet = document.createElement('div');
        sheet.className = 'reg-help-sheet';
        sheet.innerHTML = _buildHelpHTML();
        overlay.appendChild(sheet);
        document.body.appendChild(overlay);
    };

    window._regCloseHelp = function () {
        const overlay = document.getElementById('reg-help-overlay');
        if (overlay) overlay.remove();
    };

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
