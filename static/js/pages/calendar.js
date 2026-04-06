export function render(player, allSystems) {
    return `
    <style>
        .calendar-page-wrapper {
            flex: 1;
            height: 100%;
            overflow: hidden;
            background: #fdfaf6;
            display: flex;
            flex-direction: column;
        }
        .calendar-header {
            background: #fff;
            padding: 15px 20px;
            border-bottom: 3px solid #000;
            flex-shrink: 0;
            z-index: 100;
        }
        .calendar-content {
            flex-grow: 1;
            overflow-y: auto;
            padding: 15px;
            -webkit-overflow-scrolling: touch;
        }
        .month-tag {
            width: 45px; height: 45px;
            border: 2px solid #000;
            border-radius: 10px;
            background: #fff;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            font-weight: 900;
            flex-shrink: 0;
        }
        .nav-pills .nav-link {
            font-weight: 900;
            color: #000;
            border: 2px solid transparent;
            transition: 0.1s;
        }
        .nav-pills .nav-link.active {
            background-color: var(--color-blue, #85e3ff) !important;
            color: #000 !important;
            border: 2px solid #000 !important;
            box-shadow: 3px 3px 0px #000;
        }
    </style>
    <div class="calendar-page-wrapper">
    <div class="calendar-header">
        <div class="d-flex align-items-center mb-3">
            <a href="#/phone" class="text-dark me-3" style="text-decoration:none;">
                <i class="bi bi-chevron-left fs-4" style="-webkit-text-stroke: 1.5px black;"></i>
            </a>
            <h5 class="mb-0 fw-bold" style="letter-spacing: 1px;">赛季日历</h5>
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
        html += `
            <div class="level-divider text-muted small fw-bold mt-4 mb-2">
                <i class="bi bi-trophy-fill me-1"></i> ${levelName.replace(/_/g, ' ')}
            </div>`;
        for (const t of events) {
            const isCurrent = t.month === player.month ? 'current-month' : '';
            html += `
            <div class="card tournament-card mb-4 ${isCurrent}">
                <div class="card-body">
                    <div class="d-flex">
                        <div class="month-tag me-3">
                            <span class="text-muted" style="font-size: 8px; line-height: 1;">MON</span>
                            <span class="text-dark">${t.month}</span>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start">
                                <h6 class="fw-bold mb-1">${t.name}</h6>
                                <span class="badge bg-dark" style="font-size: 10px; border-radius: 5px;">${t.level_code}</span>
                            </div>
                            <p class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ${t.location}</p>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge rounded-pill border border-dark ${player.general_stats >= t.req_stats ? 'bg-success text-white' : 'bg-danger text-white'}">
                                    能力要求: ${t.req_stats}
                                </span>
                                <small class="text-muted" style="font-size: 10px; font-weight: 900;">积分: +${t.points[t.points.length - 1]}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    }
    return html;
}

function _renderITFJunior(player, itfJuniorData) {
    const epMap = { 'J500': 700, 'J300': 350, 'J200': 150, 'J100': 60, 'J60': 0, 'J30': 0 };
    let html = `
        <div class="alert alert-info py-2 mb-4" style="font-size: 11px; border: 2px solid #000; border-radius: 12px;">
            <i class="bi bi-info-circle me-1"></i>
            ITF Junior 赛事通常在 14 岁后解锁。
        </div>`;

    for (const [levelName, events] of Object.entries(itfJuniorData)) {
        if (!Array.isArray(events)) continue;
        html += `
            <div class="level-divider text-muted small fw-bold mt-4 mb-2">
                <i class="bi bi-globe-central-south-asia me-1"></i> ${levelName}
            </div>`;
        for (const t of events) {
            html += `
            <div class="card tournament-card mb-4 opacity-75">
                <div class="card-body">
                    <div class="d-flex">
                        <div class="month-tag me-3" style="background: #eee;">
                            <span class="text-muted" style="font-size: 8px;">MON</span>
                            <span class="text-dark">${t.month}</span>
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="fw-bold mb-1 text-secondary">${t.name}</h6>
                            <p class="small text-muted mb-2"><i class="bi bi-globe"></i> ${t.location}</p>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge rounded-pill bg-secondary" style="font-size: 10px; letter-spacing: 0.5px;">
                                    ENTRY POINTS: ${epMap[t.level_code] || 0}
                                </span>
                                <small class="text-muted" style="font-size: 10px;">${t.level_code}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    }
    return html;
}

function _renderITF(player, itfData) {
    let html = `
        <div class="alert alert-info py-2 mb-4" style="font-size: 11px; border: 2px solid #000; border-radius: 12px;">
            <i class="bi bi-info-circle me-1"></i>
            ITF 职业赛事需要达到相应积分门槛。
        </div>`;

    for (const [levelName, events] of Object.entries(itfData)) {
        if (!Array.isArray(events)) continue;
        html += `
            <div class="level-divider text-muted small fw-bold mt-4 mb-2">
                <i class="bi bi-globe me-1"></i> ${levelName.replace(/_/g, ' ')}
            </div>`;
        for (const t of events) {
            const isCurrent = t.month === player.month ? 'current-month' : '';
            html += `
            <div class="card tournament-card mb-4 ${isCurrent}">
                <div class="card-body">
                    <div class="d-flex">
                        <div class="month-tag me-3">
                            <span class="text-muted" style="font-size: 8px; line-height: 1;">MON</span>
                            <span class="text-dark">${t.month}</span>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start">
                                <h6 class="fw-bold mb-1">${t.name}</h6>
                                <span class="badge bg-dark" style="font-size: 10px; border-radius: 5px;">${t.level_code}</span>
                            </div>
                            <p class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ${t.location}</p>
                            <div class="d-flex align-items-center gap-2">
                                ${t.entry_points !== undefined
                                    ? `<span class="badge rounded-pill border border-dark ${(player.ranking_points || 0) >= t.entry_points ? 'bg-success text-white' : 'bg-danger text-white'}">
                                        积分门槛: ${t.entry_points}
                                    </span>`
                                    : `<span class="badge rounded-pill border border-dark ${player.general_stats >= t.req_stats ? 'bg-success text-white' : 'bg-danger text-white'}">
                                        能力要求: ${t.req_stats}
                                    </span>`
                                }
                                <small class="text-muted" style="font-size: 10px; font-weight: 900;">积分: +${t.points[t.points.length - 1]}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    }
    return html;
}

function _renderWTA(player, wtaData) {
    let html = `
        <div class="alert alert-info py-2 mb-4" style="font-size: 11px; border: 2px solid #000; border-radius: 12px;">
            <i class="bi bi-info-circle me-1"></i>
            WTA 巡回赛是最高级别的女子职业赛事。
        </div>`;

    for (const [levelName, events] of Object.entries(wtaData)) {
        if (!Array.isArray(events)) continue;
        html += `
            <div class="level-divider text-muted small fw-bold mt-4 mb-2">
                <i class="bi bi-trophy-fill me-1"></i> ${levelName.replace(/_/g, ' ')}
            </div>`;
        for (const t of events) {
            const isCurrent = t.month === player.month ? 'current-month' : '';
            html += `
            <div class="card tournament-card mb-4 ${isCurrent}">
                <div class="card-body">
                    <div class="d-flex">
                        <div class="month-tag me-3">
                            <span class="text-muted" style="font-size: 8px; line-height: 1;">MON</span>
                            <span class="text-dark">${t.month}</span>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start">
                                <h6 class="fw-bold mb-1">${t.name}</h6>
                                <span class="badge bg-dark" style="font-size: 10px; border-radius: 5px;">${t.level_code}</span>
                            </div>
                            <p class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ${t.location}</p>
                            <div class="d-flex align-items-center gap-2">
                                ${t.entry_points !== undefined
                                    ? `<span class="badge rounded-pill border border-dark ${(player.ranking_points || 0) >= t.entry_points ? 'bg-success text-white' : 'bg-danger text-white'}">
                                        积分门槛: ${t.entry_points}
                                    </span>`
                                    : `<span class="badge rounded-pill border border-dark ${player.general_stats >= t.req_stats ? 'bg-success text-white' : 'bg-danger text-white'}">
                                        能力要求: ${t.req_stats}
                                    </span>`
                                }
                                <small class="text-muted" style="font-size: 10px; font-weight: 900;">积分: +${t.points[t.points.length - 1]}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    }
    return html;
}

export function init() {
    // Bootstrap tabs work automatically via data-bs-toggle attributes
}
