export function render(player) {
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
        .tab-item { flex: 1; text-align: center; padding: 15px; font-weight: bold; cursor: pointer; }
        .tab-item.active { background: var(--comic-black); color: #fff; }
        .rank-card {
            display: flex; align-items: center; background: #fff;
            border: 2px solid var(--comic-black); border-radius: 12px;
            padding: 15px; margin-bottom: 15px;
            box-shadow: 4px 4px 0px rgba(0,0,0,0.05);
        }
        .rank-num { width: 50px; font-weight: 900; font-style: italic; color: var(--comic-purple); font-size: 1.2rem; }
        .player-info { flex: 1; font-weight: bold; }
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
    <div class="tab-nav">
        <div class="tab-item active" id="tab-my" onclick="switchView('my')">我的组别 (CTJ-U14)</div>
        <div class="tab-item" id="tab-world" onclick="switchView('world')">世界排名 (WTA)</div>
    </div>
    <div class="container">
        <div id="view-my">
            <div id="leaderboard-my"></div>
        </div>
        <div id="view-world" style="display:none;">
            <div id="leaderboard-world"></div>
        </div>
    </div>
    <div class="sticky-wrapper">
        <div id="sticky-me" class="me-sticky-bar" onclick="showPointsDetail()">
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

export function init(playerPointsData, worldRankingData, playerYear, playerMonth) {
    const PLAYER_YEAR = playerYear;
    const PLAYER_MONTH = playerMonth;

    function renderLists() {
        const myContainer = document.getElementById('leaderboard-my');
        if (worldRankingData && worldRankingData.competitors) {
            const top20 = worldRankingData.competitors.slice(0, 20);
            myContainer.innerHTML = top20.map(p => `
                <div class="rank-card">
                    <div class="rank-num">#${p.rank}</div>
                    <div class="player-info">${p.name}</div>
                    <div class="pts-val">${p.points}</div>
                </div>`).join('');
        }

        const worldContainer = document.getElementById('leaderboard-world');
        if (worldRankingData && worldRankingData.wta) {
            worldContainer.innerHTML = worldRankingData.wta.slice(0, 20).map(p => `
                <div class="rank-card">
                    <div class="rank-num">#${p.rank}</div>
                    <div class="player-info">${p.name}</div>
                    <div class="pts-val">${p.points}</div>
                </div>`).join('');
        }
    }

    function updateDynamicMeInfo() {
        if (!playerPointsData || !playerPointsData.CTJ) return;
        const pts = playerPointsData.CTJ.summary.total_effective_points;
        const allCompetitors = (worldRankingData && worldRankingData.competitors) ? worldRankingData.competitors : [];
        const higherThanMe = allCompetitors.filter(p => p.points > pts).length;
        const currentRank = higherThanMe + 1;
        document.getElementById('my-bar-pts').innerText = pts;
        document.getElementById('my-live-rank').innerText = "#" + currentRank;
    }

    window.showPointsDetail = function() {
        if (!playerPointsData || !playerPointsData.CTJ) {
            console.error("玩家积分数据尚未加载");
            return;
        }
        const ctj = playerPointsData.CTJ;
        document.getElementById('detail-total-pts').innerText = ctj.summary.total_effective_points;
        document.getElementById('detail-rule').innerText = "计算规则: " + ctj.summary.ranking_system;

        const list = document.getElementById('detail-history-list');
        const history = ctj.point_history || [];
        list.innerHTML = history.slice().reverse().map(item => {
            const ageInMonths = (PLAYER_YEAR * 12 + PLAYER_MONTH) - (item.year * 12 + item.month);
            const monthsLeft = 12 - ageInMonths;
            let expiryClass = "effective";
            if (monthsLeft <= 1) {
                expiryClass = "expiry-red";
            } else if (monthsLeft <= 4) {
                expiryClass = "expiry-yellow";
            }
            return `
                <div class="point-item ${item.is_effective ? expiryClass : ''}">
                    <div>
                        <div style="font-weight:bold;">${item.desc}</div>
                        <div style="font-size:0.8rem; color:#888;">
                            ${item.year}年${item.month}月获得
                            <span class="badge ${monthsLeft <= 4 ? 'bg-light text-dark border border-dark' : ''}">
                                ⏰ 剩 ${monthsLeft} 个月过期
                            </span>
                        </div>
                    </div>
                    <div style="font-weight:900; color:var(--comic-purple); font-size:1.3rem;">+${item.points}</div>
                </div>`;
        }).join('');

        document.getElementById('detail-view').style.display = 'block';
    };

    window.hidePointsDetail = function() {
        document.getElementById('detail-view').style.display = 'none';
    };

    window.switchView = function(type) {
        document.getElementById('view-my').style.display = type === 'my' ? 'block' : 'none';
        document.getElementById('view-world').style.display = type === 'world' ? 'block' : 'none';
        document.getElementById('sticky-me').style.display = type === 'my' ? 'flex' : 'none';
        document.getElementById('tab-my').classList.toggle('active', type === 'my');
        document.getElementById('tab-world').classList.toggle('active', type === 'world');
    };

    renderLists();
    updateDynamicMeInfo();
}
