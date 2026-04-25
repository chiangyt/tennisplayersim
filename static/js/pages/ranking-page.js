import { computeProfessionalRank } from '../ranking.js';

export function render(player) {
    const age = player ? player.age : 12;
    const showCtj = age <= 14;
    const showItfJr = age >= 13;
    const initialTab = showCtj ? 'ctj' : (showItfJr ? 'itfjr' : 'world');

    const tabItems = [];
    if (showCtj)  tabItems.push({ id: 'ctj',    label: '我的组别 (CTJ-U14)' });
    if (showItfJr) tabItems.push({ id: 'itfjr', label: 'ITF Junior 排名' });
    tabItems.push({ id: 'world', label: '世界排名 (WTA)' });
    // 把 initialTab 暴露给 init() 用作启动 tab
    window.__initialRankingTab = initialTab;

    const tabNavHtml = tabItems.map((t, i) =>
        `<div class="tab-item ${i === 0 ? 'active' : ''}" id="tab-${t.id}" onclick="switchView('${t.id}')">${t.label}</div>`
    ).join('');

    const viewsHtml = [
        showCtj  ? `<div id="view-ctj"><div id="leaderboard-ctj"></div></div>` : '',
        showItfJr ? `<div id="view-itfjr" style="display:none;"><div id="leaderboard-itfjr"></div></div>` : '',
        `<div id="view-world" style="display:none;"><div id="leaderboard-world"></div></div>`,
    ].join('');

    return `
    <style>
        :root {
            --comic-black: #000;
            --comic-purple: #9b59b6;
            --comic-green: #2ecc71;
            --bg-color: #fdfaf6;
        }
        .ranking-page-body {
            background: var(--bg-color);
            font-family: 'PingFang SC', sans-serif;
            margin: 0; padding: 0;
            height: 100%;
            overflow-y: auto;
        }
        .ranking-page-body .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            padding-bottom: 100px;
        }
        .tab-nav {
            display: flex;
            border-bottom: 3px solid var(--comic-black);
            background: #fff;
            position: sticky; top: 0; z-index: 10;
        }
        .tab-item { flex: 1; text-align: center; padding: 15px; font-weight: bold; cursor: pointer; font-size: 0.85rem; }
        .tab-item.active { background: var(--comic-black); color: #fff; }
        .rank-card {
            display: flex; align-items: center; background: #fff;
            border: 2px solid var(--comic-black); border-radius: 12px;
            padding: 15px; margin-bottom: 15px;
            box-shadow: 4px 4px 0px rgba(0,0,0,0.05);
        }
        .rank-num { min-width: 55px; padding-right: 10px; flex-shrink: 0; font-weight: 900; font-style: italic; color: var(--comic-purple); font-size: 1.2rem; white-space: nowrap; }
        .player-info { flex: 1; font-weight: bold; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
        .pts-val { font-weight: 900; }
        .sticky-wrapper {
            position: fixed; bottom: 0; left: 0; right: 0;
            display: flex; justify-content: center;
            z-index: 100;
        }
        .me-sticky-bar {
            width: 100%; max-width: 600px;
            background: #fff; border: 4px solid var(--comic-black);
            border-bottom: none; border-radius: 20px 20px 0 0;
            padding: 15px 25px; display: flex; align-items: center;
            box-shadow: 0 -10px 20px rgba(0,0,0,0.1); cursor: pointer;
        }
        .header-actions {
            padding: 10px 0;
            display: flex;
            justify-content: flex-start;
        }
        .back-to-phone {
            text-decoration: none;
            color: #000;
            font-weight: 900;
            border: 2px solid #000;
            padding: 5px 15px;
            border-radius: 8px;
            background: #fff;
            box-shadow: 3px 3px 0px #000;
            transition: 0.1s;
            font-size: 0.9rem;
        }
        .back-to-phone:active {
            box-shadow: 0px 0px 0px #000;
            transform: translate(3px, 3px);
        }
        #detail-view {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: var(--bg-color); z-index: 200; display: none; overflow-y: auto;
        }
        .detail-container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .summary-box {
            border: 3px solid var(--comic-black); box-shadow: 8px 8px 0px var(--comic-black);
            border-radius: 15px; padding: 30px; text-align: center; background: #fff; margin-bottom: 30px;
        }
        .point-item {
            border: 2px solid var(--comic-black); border-radius: 12px; padding: 15px;
            margin-bottom: 15px; display: flex; justify-content: space-between; background: #fff;
        }
        .point-item.expiry-red { border-left: 10px solid #ff4d4d !important; }
        .point-item.expiry-yellow { border-left: 10px solid #ffcc00 !important; }
        .point-item.effective { border-left: 10px solid var(--comic-green) !important; }
    </style>
    <div class="ranking-page-body">
    <div class="header-actions">
        <a href="#/phone" class="back-to-phone">⬅ 退出排名</a>
    </div>
    <div class="tab-nav">${tabNavHtml}</div>
    <div class="container">
        ${viewsHtml}
    </div>
    <div class="sticky-wrapper">
        <div id="sticky-me" class="me-sticky-bar">
            <div class="rank-num" id="my-live-rank">#--</div>
            <div class="player-info">
                ${player ? player.name : '选手'}
                <span style="background:#ffde00; border:2px solid #000; padding:2px 6px; border-radius:5px; font-size:0.7rem; margin-left:8px;">YOU</span>
            </div>
            <div class="pts-val" id="my-bar-pts">0</div>
            <div style="margin-left: 15px;"></div>
        </div>
    </div>
    <div id="detail-view">
        <div class="detail-container">
            <button onclick="hidePointsDetail()" style="border:2px solid #000; padding:8px 15px; border-radius:8px; font-weight:bold; cursor:pointer; background:#fff; margin-bottom:20px;">⬅ 返回</button>
            <div class="summary-box">
                <div id="detail-sys" style="font-weight: 900; letter-spacing: 1px;">CTJ SYSTEM</div>
                <div style="font-size: 4rem; font-weight: 900; color: var(--comic-purple);" id="detail-total-pts">0</div>
                <div id="detail-rule" style="color: #666;"></div>
            </div>
            <div id="detail-history-list"></div>
        </div>
    </div>
    </div>`;
}

export function init(playerPointsData, worldRankingData, playerYear, playerMonth, player) {
    const PLAYER_YEAR = playerYear;
    const PLAYER_MONTH = playerMonth;
    const playerName = player ? player.name : '选手';
    const playerAge = player ? player.age : 12;

    // CTJ 积分
    const ctjPts = (playerPointsData.CTJ && playerPointsData.CTJ.summary)
        ? (playerPointsData.CTJ.summary.total_effective_points || 0) : 0;

    // ITF Junior 积分
    const itfJrPts = (playerPointsData.ITF_Junior && playerPointsData.ITF_Junior.summary)
        ? (playerPointsData.ITF_Junior.summary.total_effective_points || 0) : 0;

    // 成人职业积分（ITF 与 WTA 是同一池）
    const proTotalPts = (playerPointsData.WTA && playerPointsData.WTA.summary)
        ? (playerPointsData.WTA.summary.total_effective_points || 0) : 0;

    const ctjNpcs  = (worldRankingData && worldRankingData.competitors) || [];
    const itfJrNpcs = (worldRankingData && worldRankingData.itf_junior)  || [];
    const wtaNpcs  = (worldRankingData && worldRankingData.wta) || [];

    const proRank = computeProfessionalRank(proTotalPts, wtaNpcs);

    function _pointItemHtml(item) {
        const ageInMonths = (PLAYER_YEAR * 12 + PLAYER_MONTH) - (item.year * 12 + item.month);
        const monthsLeft = 12 - ageInMonths;
        let expiryClass = 'effective';
        if (monthsLeft <= 1) expiryClass = 'expiry-red';
        else if (monthsLeft <= 4) expiryClass = 'expiry-yellow';
        return `
            <div class="point-item ${item.is_effective ? expiryClass : ''}">
                <div>
                    <div style="font-weight:bold;">${item.desc}</div>
                    <div style="font-size:0.8rem;color:#888;">
                        ${item.year}年${item.month}月获得
                        <span class="badge ${monthsLeft <= 4 ? 'bg-light text-dark border border-dark' : ''}">
                            ⏰ 剩 ${monthsLeft} 个月过期
                        </span>
                    </div>
                </div>
                <div style="font-weight:900;color:var(--comic-purple);font-size:1.3rem;">+${item.points}</div>
            </div>`;
    }

    function renderCtjList() {
        const el = document.getElementById('leaderboard-ctj');
        if (!el) return;
        el.innerHTML = ctjNpcs.slice(0, 20).map(p => `
            <div class="rank-card">
                <div class="rank-num">#${p.rank}</div>
                <div class="player-info">${p.name}</div>
                <div class="pts-val">${p.points}</div>
            </div>`).join('');
    }

    function renderItfJrList() {
        const el = document.getElementById('leaderboard-itfjr');
        if (!el) return;
        if (itfJrNpcs.length === 0) {
            el.innerHTML = '<div style="text-align:center;color:#aaa;padding:20px;">暂无 ITF Junior 排名数据</div>';
            return;
        }
        const sorted = [...itfJrNpcs].sort((a, b) => b.points - a.points);
        const playerRank = sorted.filter(n => n.points > itfJrPts).length + 1;

        let merged;
        if (itfJrPts > 0 && playerRank <= sorted.length) {
            merged = [...sorted];
            merged.splice(playerRank - 1, 0, { rank: playerRank, name: playerName, points: itfJrPts, isPlayer: true });
            merged = merged.slice(0, 22);
        } else {
            merged = sorted.slice(0, 20);
        }

        let html = merged.map(p => {
            const youBadge = p.isPlayer
                ? `<span style="background:#ffde00;border:2px solid #000;padding:1px 5px;border-radius:5px;font-size:0.7rem;margin-left:6px;">YOU</span>`
                : '';
            const cardStyle = p.isPlayer ? 'border:3px solid #ffde00;background:#fffbe6;' : '';
            return `
                <div class="rank-card" style="${cardStyle}">
                    <div class="rank-num">#${p.rank}</div>
                    <div class="player-info">${p.name}${youBadge}</div>
                    <div class="pts-val">${p.points}</div>
                </div>`;
        }).join('');

        if (itfJrPts > 0 && playerRank > sorted.length) {
            html += `
                <div style="text-align:center;color:#aaa;padding:8px 0;font-size:13px;">· · ·</div>
                <div class="rank-card" style="border:3px solid #ffde00;background:#fffbe6;">
                    <div class="rank-num">#${playerRank}</div>
                    <div class="player-info">${playerName}
                        <span style="background:#ffde00;border:2px solid #000;padding:1px 5px;border-radius:5px;font-size:0.7rem;margin-left:6px;">YOU</span>
                    </div>
                    <div class="pts-val">${itfJrPts}</div>
                </div>`;
        }

        if (itfJrPts === 0) {
            html += `<div style="text-align:center;color:#aaa;padding:16px;font-size:13px;">暂无 ITF Junior 积分，参赛后将出现在此排名中</div>`;
        }

        el.innerHTML = html;
    }

    function renderWorldList() {
        const worldContainer = document.getElementById('leaderboard-world');
        if (!worldContainer) return;

        const npcTop = [...wtaNpcs].sort((a, b) => b.points - a.points);
        const playerCard = (proRank !== null) ? {
            rank: proRank, name: playerName, points: proTotalPts, isPlayer: true
        } : null;

        let merged;
        if (playerCard && proRank <= npcTop.length) {
            merged = [...npcTop];
            merged.splice(proRank - 1, 0, playerCard);
            merged = merged.slice(0, 22);
        } else {
            merged = npcTop.slice(0, 20);
        }

        let html = merged.map(p => {
            const youBadge = p.isPlayer
                ? `<span style="background:#ffde00;border:2px solid #000;padding:1px 5px;border-radius:5px;font-size:0.7rem;margin-left:6px;">YOU</span>`
                : '';
            const cardStyle = p.isPlayer ? 'border:3px solid #ffde00;background:#fffbe6;' : '';
            return `
                <div class="rank-card" style="${cardStyle}">
                    <div class="rank-num">#${p.rank}</div>
                    <div class="player-info">${p.name}${youBadge}</div>
                    <div class="pts-val">${p.points}</div>
                </div>`;
        }).join('');

        if (playerCard && proRank > npcTop.length) {
            html += `
                <div style="text-align:center;color:#aaa;padding:8px 0;font-size:13px;">· · ·</div>
                <div class="rank-card" style="border:3px solid #ffde00;background:#fffbe6;">
                    <div class="rank-num">#${proRank}${proRank >= 1500 ? '+' : ''}</div>
                    <div class="player-info">${playerName}
                        <span style="background:#ffde00;border:2px solid #000;padding:1px 5px;border-radius:5px;font-size:0.7rem;margin-left:6px;">YOU</span>
                    </div>
                    <div class="pts-val">${proTotalPts}</div>
                </div>`;
        }

        if (proRank === null) {
            html += `<div style="text-align:center;color:#aaa;padding:16px;font-size:13px;">尚无成人积分，参加 ITF/WTA 赛事后将出现在此排名中</div>`;
        }

        worldContainer.innerHTML = html;
    }

    function updateStickyForTab(type) {
        const stickyEl = document.getElementById('sticky-me');
        if (!stickyEl) return;
        if (type === 'ctj') {
            const allComp = ctjNpcs;
            const rank = allComp.filter(p => p.points > ctjPts).length + 1;
            document.getElementById('my-bar-pts').innerText = ctjPts;
            document.getElementById('my-live-rank').innerText = '#' + rank;
            stickyEl.onclick = () => window.showPointsDetail('ctj');
        } else if (type === 'itfjr') {
            const rank = itfJrNpcs.filter(p => p.points > itfJrPts).length + 1;
            document.getElementById('my-bar-pts').innerText = itfJrPts;
            document.getElementById('my-live-rank').innerText = itfJrPts > 0 ? '#' + rank : '#—';
            stickyEl.onclick = () => window.showPointsDetail('itfjr');
        } else {
            const rankStr = proRank !== null
                ? '#' + proRank + (proRank >= 1500 ? '+' : '')
                : '#—';
            document.getElementById('my-bar-pts').innerText = proTotalPts;
            document.getElementById('my-live-rank').innerText = rankStr;
            stickyEl.onclick = () => window.showPointsDetail('pro');
        }
    }

    window.showPointsDetail = function(mode) {
        const detailView = document.getElementById('detail-view');
        const list = document.getElementById('detail-history-list');
        if (!detailView || !list) return;

        if (mode === 'pro') {
            const wtaHistory = (playerPointsData.WTA && playerPointsData.WTA.point_history) || [];
            const combined = [...wtaHistory].sort((a, b) =>
                (b.year * 12 + b.month) - (a.year * 12 + a.month));
            document.getElementById('detail-sys').innerText = 'PRO RANKING';
            document.getElementById('detail-total-pts').innerText = proTotalPts;
            document.getElementById('detail-rule').innerText = `WTA 体系职业积分（ITF 女子赛事同池）`;
            list.innerHTML = combined.length > 0
                ? combined.map(_pointItemHtml).join('')
                : '<div style="text-align:center;color:#aaa;padding:20px;">暂无成人赛事记录</div>';
        } else if (mode === 'itfjr') {
            const data = playerPointsData.ITF_Junior;
            document.getElementById('detail-sys').innerText = 'ITF JUNIOR';
            document.getElementById('detail-total-pts').innerText = itfJrPts;
            document.getElementById('detail-rule').innerText = data
                ? '计算规则: ' + (data.summary.ranking_system || 'Best-of-8')
                : '8';
            list.innerHTML = (data && data.point_history && data.point_history.length > 0)
                ? [...data.point_history].reverse().map(_pointItemHtml).join('')
                : '<div style="text-align:center;color:#aaa;padding:20px;">暂无 ITF Junior 赛事记录</div>';
        } else {
            const ctj = playerPointsData.CTJ;
            if (!ctj) return;
            document.getElementById('detail-sys').innerText = 'CTJ SYSTEM';
            document.getElementById('detail-total-pts').innerText = ctj.summary.total_effective_points;
            document.getElementById('detail-rule').innerText = '计算规则: ' + ctj.summary.ranking_system;
            list.innerHTML = (ctj.point_history || []).slice().reverse().map(_pointItemHtml).join('');
        }

        detailView.style.display = 'block';
    };

    window.hidePointsDetail = function() {
        document.getElementById('detail-view').style.display = 'none';
    };

    window.switchView = function(type) {
        ['ctj', 'itfjr', 'world'].forEach(id => {
            const v = document.getElementById(`view-${id}`);
            const t = document.getElementById(`tab-${id}`);
            if (v) v.style.display = type === id ? 'block' : 'none';
            if (t) t.classList.toggle('active', type === id);
        });
        updateStickyForTab(type);
    };

    renderCtjList();
    renderItfJrList();
    renderWorldList();

    // 启动时根据年龄定位到正确的初始 Tab，并切换视图显示状态
    const initialTab = window.__initialRankingTab
        || (playerAge <= 14 ? 'ctj' : (playerAge >= 13 ? 'itfjr' : 'world'));
    window.switchView(initialTab);
}
