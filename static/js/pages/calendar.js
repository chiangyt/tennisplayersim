// Prize money tables (CNY), aligned with character.js _PRIZE_TABLES
const _PRIZE_TABLES = {
    J500:   [0, 500, 1200, 2500, 5000, 8000],
    J300:   [0, 300, 700, 1500, 3000, 5000],
    J100:   [0, 100, 300, 700, 1500, 2500],
    W15:    [100, 800, 1600, 3000, 5500, 10000],
    W35:    [500, 1500, 3000, 6000, 10000, 20000],
    W75:    [5000, 7000, 15000, 28000, 40000, 70000],
    W100:   [8000, 14000, 23000, 40000, 60000, 100000],
    WTA250: [10000, 18000, 30000, 60000, 100000, 180000],
    WTA500: [60000, 140000, 200000, 350000, 600000, 1000000],
    WTA1000:[280000, 350000, 600000, 1300000, 2500000, 4000000, 7000000],
    GS:     [800000, 1000000, 2000000, 3000000, 5000000, 9000000, 17000000, 30000000],
};
const _STD_ROUNDS    = ["R32", "R16", "1/4决赛", "半决赛", "决赛", "冠军"];
const _WTA1000_ROUNDS= ["R64", "R32", "R16", "1/4决赛", "半决赛", "决赛", "冠军"];
const _GS_ROUNDS     = ["R128", "R64", "R32", "R16", "1/4决赛", "半决赛", "决赛", "冠军"];

function _getRounds(t) {
    if (t.level_code === 'GS') return _GS_ROUNDS;
    if (t.level_code === 'WTA1000') return _WTA1000_ROUNDS;
    return _STD_ROUNDS;
}

function _fmt(n) {
    return n > 0 ? `¥${n.toLocaleString()}` : '—';
}

function _makeCard(t, player, idx) {
    const isCurrent = t.month === player.month;
    const currentClass = isCurrent ? 'current-month' : '';
    const currentStyle = isCurrent ? 'background: #fff9e6;' : '';
    const maxPts = t.points[t.points.length - 1];
    let reqBadge = '';
    if (t.req_stats != null) {
        const met = player.general_stats >= t.req_stats;
        reqBadge = `<span class="badge rounded-pill border border-dark ${met ? 'bg-success' : 'bg-danger'} text-white" style="font-size:10px;">
            能力要求: ${t.req_stats}
        </span>`;
    } else if (t.req_ranking != null) {
        reqBadge = `<span class="badge rounded-pill border border-dark bg-secondary text-white" style="font-size:10px;">
            门槛积分: ${t.req_ranking}
        </span>`;
    } else if (t.entry_points != null) {
        reqBadge = `<span class="badge rounded-pill border border-dark bg-secondary text-white" style="font-size:10px;">
            ENTRY: ${t.entry_points}
        </span>`;
    }
    return `
    <div class="card tournament-card mb-4 ${currentClass}" style="${currentStyle} cursor:pointer;"
         onclick="window._calShowDetail(${idx})">
        <div class="card-body">
            <div class="d-flex">
                <div class="month-tag me-3">
                    <span class="text-muted" style="font-size:8px;line-height:1;">MON</span>
                    <span class="text-dark">${t.month}</span>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <h6 class="fw-bold mb-1">${t.name}</h6>
                        <span class="badge bg-dark" style="font-size:10px;border-radius:5px;">${t.level_code}</span>
                    </div>
                    <p class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ${t.location}</p>
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        ${reqBadge}
                        <small class="text-muted" style="font-size:10px;font-weight:900;">积分: +${maxPts}</small>
                        <small class="text-muted" style="font-size:10px;">
                            <i class="bi bi-chevron-right"></i> 详情
                        </small>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

export function render(player, allSystems) {
    window._calTournamentData = [];
    return `
    <style>
        .calendar-page-wrapper {
            flex: 1; height: 100%; overflow: hidden;
            background: #fdfaf6; display: flex; flex-direction: column;
        }
        .calendar-header {
            background: #fff; padding: 15px 20px;
            border-bottom: 3px solid #000; flex-shrink: 0; z-index: 100;
        }
        .calendar-content { flex-grow: 1; overflow-y: auto; padding: 15px; -webkit-overflow-scrolling: touch; }
        .month-tag {
            width: 45px; height: 45px; border: 2px solid #000; border-radius: 10px;
            background: #fff; display: flex; flex-direction: column;
            align-items: center; justify-content: center; font-weight: 900; flex-shrink: 0;
        }
        .nav-pills .nav-link { font-weight: 900; color: #000; border: 2px solid transparent; transition: 0.1s; }
        .nav-pills .nav-link.active {
            background-color: var(--color-blue, #85e3ff) !important;
            color: #000 !important; border: 2px solid #000 !important; box-shadow: 3px 3px 0px #000;
        }
        .tournament-card { cursor: pointer; }
        .tournament-card:active { transform: translate(3px,3px) !important; box-shadow: 1px 1px 0 #000 !important; }
        /* Detail bottom sheet */
        .cal-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.55);
            z-index: 9000; display: flex; align-items: flex-end;
        }
        .cal-sheet {
            width: 100%; background: #fdfaf6;
            border: 3px solid #000; border-bottom: none;
            border-radius: 20px 20px 0 0;
            padding: 0 16px 32px; max-height: 78vh; overflow-y: auto;
            animation: cal-up 0.22s cubic-bezier(0.34,1.4,0.64,1);
        }
        @keyframes cal-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .cal-handle {
            width: 40px; height: 5px; background: #ccc; border-radius: 3px;
            margin: 12px auto 16px;
        }
        .cal-round-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .cal-round-table th, .cal-round-table td {
            border: 2px solid #000; padding: 8px 6px; text-align: center; font-size: 13px;
        }
        .cal-round-table th { background: #000; color: #fff; font-weight: 900; }
        .cal-round-table tr:nth-child(even) td { background: #f5f0e8; }
        .cal-champion-row td { background: #ffd56b !important; font-weight: 900; }
        .cal-close-btn {
            display: block; width: 100%; margin-top: 16px;
            padding: 10px; font-weight: 900; font-size: 15px;
            background: #fff; border: 3px solid #000;
            border-radius: 12px; box-shadow: 4px 4px 0 #000;
            cursor: pointer; transition: transform 0.1s, box-shadow 0.1s;
        }
        .cal-close-btn:active { transform: translate(3px,3px); box-shadow: 0 0 0 #000; }
    </style>
    <div class="calendar-page-wrapper">
    <div class="calendar-header">
        <div class="d-flex align-items-center mb-3">
            <a href="#/phone" class="text-dark me-3" style="text-decoration:none;">
                <i class="bi bi-chevron-left fs-4" style="-webkit-text-stroke:1.5px black;"></i>
            </a>
            <h5 class="mb-0 fw-bold" style="letter-spacing:1px;">赛季日历</h5>
        </div>
        <ul class="nav nav-pills nav-justified bg-light p-1 rounded-pill" id="systemTab" role="tablist">
            <li class="nav-item">
                <button class="nav-link active" data-bs-toggle="pill" data-bs-target="#ctj-content">CTJ</button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="pill" data-bs-target="#itf-junior-content">ITF Junior</button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="pill" data-bs-target="#itf-pro-content">ITF</button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="pill" data-bs-target="#wta-content">WTA</button>
            </li>
        </ul>
    </div>
    <div class="calendar-content tab-content">
        <div class="tab-pane fade show active" id="ctj-content">
            ${_renderCTJ(player, allSystems.CTJ || {})}
        </div>
        <div class="tab-pane fade" id="itf-junior-content">
            ${_renderITFJunior(player, allSystems.ITF_Junior || {})}
        </div>
        <div class="tab-pane fade" id="itf-pro-content">
            ${_renderITF(player, allSystems.ITF || {})}
        </div>
        <div class="tab-pane fade" id="wta-content">
            ${_renderWTA(player, allSystems.WTA || {})}
        </div>
    </div>
    </div>`;
}

function _renderCTJ(player, ctjData) {
    let html = '';
    for (const [levelName, events] of Object.entries(ctjData)) {
        if (!Array.isArray(events)) continue;
        html += `<div class="level-divider text-muted small fw-bold mt-4 mb-2">
            <i class="bi bi-trophy-fill me-1"></i> ${levelName.replace(/_/g, ' ')}
        </div>`;
        for (const t of events) {
            const tagged = { ...t, _system: 'CTJ' };
            const idx = window._calTournamentData.length;
            window._calTournamentData.push(tagged);
            html += _makeCard(tagged, player, idx);
        }
    }
    return html;
}

function _renderITFJunior(player, itfJuniorData) {
    let html = '';
    for (const [levelName, events] of Object.entries(itfJuniorData)) {
        if (!Array.isArray(events)) continue;
        html += `<div class="level-divider text-muted small fw-bold mt-4 mb-2">
            <i class="bi bi-globe-central-south-asia me-1"></i> ${levelName}
        </div>`;
        for (const t of events) {
            const idx = window._calTournamentData.length;
            window._calTournamentData.push(t);
            html += _makeCard(t, player, idx);
        }
    }
    return html;
}

function _renderITF(player, itfData) {
    let html = '';
    for (const [levelName, events] of Object.entries(itfData)) {
        if (!Array.isArray(events)) continue;
        html += `<div class="level-divider text-muted small fw-bold mt-4 mb-2">
            <i class="bi bi-globe me-1"></i> ${levelName.replace(/_/g, ' ')}
        </div>`;
        for (const t of events) {
            const idx = window._calTournamentData.length;
            window._calTournamentData.push(t);
            html += _makeCard(t, player, idx);
        }
    }
    return html;
}

function _renderWTA(player, wtaData) {
    let html = '';
    for (const [levelName, events] of Object.entries(wtaData)) {
        if (!Array.isArray(events)) continue;
        html += `<div class="level-divider text-muted small fw-bold mt-4 mb-2">
            <i class="bi bi-trophy-fill me-1"></i> ${levelName.replace(/_/g, ' ')}
        </div>`;
        for (const t of events) {
            const idx = window._calTournamentData.length;
            window._calTournamentData.push(t);
            html += _makeCard(t, player, idx);
        }
    }
    return html;
}

function _buildDetailHTML(t) {
    const rounds = _getRounds(t);
    const prizeArr = _PRIZE_TABLES[t.level_code] || [];
    const isCtj = t._system === 'CTJ';
    let rowsHTML = '';
    for (let i = 0; i < rounds.length; i++) {
        const pts = t.points[i] ?? '—';
        const isChamp = i === rounds.length - 1;
        const prizeCell = isCtj ? '' : `<td>${_fmt(prizeArr[i] || 0)}</td>`;
        rowsHTML += `<tr class="${isChamp ? 'cal-champion-row' : ''}">
            <td style="font-weight:${isChamp ? 900 : 400};">${rounds[i]}${isChamp ? ' 🏆' : ''}</td>
            <td>${pts}</td>
            ${prizeCell}
        </tr>`;
    }

    let reqInfo = '';
    if (t.req_stats != null) reqInfo = `<span class="badge border border-dark bg-light text-dark me-2" style="font-size:11px;">能力要求 ${t.req_stats}</span>`;
    else if (t.req_ranking != null) reqInfo = `<span class="badge border border-dark bg-light text-dark me-2" style="font-size:11px;">门槛积分 ${t.req_ranking}</span>`;
    else if (t.entry_points != null) reqInfo = `<span class="badge border border-dark bg-light text-dark me-2" style="font-size:11px;">ENTRY ${t.entry_points}</span>`;

    return `
    <div class="cal-handle"></div>
    <div class="d-flex align-items-start mb-3">
        <div class="month-tag me-3" style="background:#ffd56b;">
            <span style="font-size:8px;line-height:1;color:#666;">MON</span>
            <span style="font-weight:900;">${t.month}</span>
        </div>
        <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-dark" style="font-size:11px;border-radius:6px;">${t.level_code}</span>
                ${reqInfo}
            </div>
            <h5 class="fw-bold mb-0">${t.name}</h5>
            <p class="small text-muted mb-0"><i class="bi bi-geo-alt"></i> ${t.location}</p>
        </div>
    </div>
    <table class="cal-round-table">
        <thead>
            <tr>
                <th>轮次</th>
                <th>排名积分</th>
                ${isCtj ? '' : '<th>奖金</th>'}
            </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
    </table>
    ${isCtj ? '<div class="text-muted small mt-2">CTJ 青少年赛事仅提供积分与荣誉，无现金奖励。</div>' : ''}
    <button class="cal-close-btn" onclick="window._calCloseDetail()">关闭</button>`;
}

export function init() {
    window._calShowDetail = function (idx) {
        const t = (window._calTournamentData || [])[idx];
        if (!t) return;
        const existing = document.getElementById('cal-detail-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'cal-detail-overlay';
        overlay.className = 'cal-overlay';
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) window._calCloseDetail();
        });

        const sheet = document.createElement('div');
        sheet.className = 'cal-sheet';
        sheet.innerHTML = _buildDetailHTML(t);
        overlay.appendChild(sheet);
        document.body.appendChild(overlay);
    };

    window._calCloseDetail = function () {
        const overlay = document.getElementById('cal-detail-overlay');
        if (overlay) overlay.remove();
    };
}
