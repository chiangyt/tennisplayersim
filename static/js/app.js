// app.js — SPA 路由器、数据加载、事件分发
import { GameState } from './game-state.js';
import { TennisGirl } from './character.js';
import { RankingManager, computeProfessionalRank } from './ranking.js';
import { SocialManager } from './social.js';
import { loadTournaments, getEventsForPlayer, findEventById, getMonthlyMatches } from './tournament.js';
import { getNewsForMonth, hasBreakingNews, fillNames } from './news.js';

import * as createPage from './pages/create.js';
import * as mainPage from './pages/main-page.js';
import * as phonePage from './pages/phone.js';
import * as calendarPage from './pages/calendar.js';
import * as registrationPage from './pages/registration.js';
import * as rankingPage from './pages/ranking-page.js';
import * as messagesPage from './pages/messages.js';
import * as chatDetailPage from './pages/chat-detail.js';
import * as newsPage from './pages/news-page.js';
import * as savePage from './pages/save-page.js';
import { TutorialManager } from './tutorial.js';

// ========== 全局单例 ==========
const rm = new RankingManager();
const socialMgr = new SocialManager();
let STATIC_DATA = {}; // { CTJ, ITF_Junior, ITF, WTA }
let NEWS_DATA = [];
let BASE_RANKING = {};
let BASE_MESSAGES = {};

const app = document.getElementById('app');

// ========== 启动 ==========
async function boot() {
    try {
        const [ctj, itfJunior, itf, wta, news, baseRanking, baseMessages] = await Promise.all([
            fetchJSON('static/data/ctj.json'),
            fetchJSON('static/data/itf_junior.json'),
            fetchJSON('static/data/itf.json'),
            fetchJSON('static/data/wta.json'),
            fetchJSON('static/data/news.json'),
            fetchJSON('static/data/player_ranking.json'),
            fetchJSON('static/data/messages.json'),
        ]);
        STATIC_DATA = { CTJ: ctj, ITF_Junior: itfJunior, ITF: itf, WTA: wta };
        NEWS_DATA = news;
        BASE_RANKING = baseRanking;
        BASE_MESSAGES = baseMessages;
    } catch (e) {
        console.error('数据加载失败', e);
        app.innerHTML = '<div style="padding:40px;text-align:center;font-weight:bold;">数据加载失败，请刷新页面重试。</div>';
        return;
    }

    // 注册事件
    setupGameEvents();

    // 启动路由
    window.addEventListener('hashchange', route);
    route();
}

async function fetchJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch ${path}`);
    return res.json();
}

// ========== 路由 ==========
function route() {
    const hash = location.hash || '#/';
    const [path, ...rest] = hash.slice(2).split('/'); // 去掉 '#/'

    // 没有游戏数据时强制跳转创建页（排除 create 和空路由）
    const state = GameState.current;
    if (!state && path !== 'create' && path !== '') {
        location.hash = '#/create';
        return;
    }

    switch (path) {
        case '':
        case 'create':
            renderPage(() => {
                app.innerHTML = createPage.render();
                createPage.init();
            });
            break;

        case 'main':
            renderPage(() => {
                const player = state.player;
                const breaking = hasBreakingNews(NEWS_DATA, player.year, player.month, state.readNews || []);
                app.innerHTML = mainPage.render(player, breaking);
                mainPage.init(player);
                initMainLogic();
                TutorialManager.maybeStart();
            });
            break;

        case 'phone':
            renderPage(() => {
                const player = state.player;
                const allData = loadTournaments(STATIC_DATA);
                const chats = socialMgr.getAllChats(state.social);
                const totalUnread = Object.values(chats)
                    .filter(c => typeof c === 'object')
                    .reduce((sum, c) => sum + (c.unread_count || 0), 0);
                app.innerHTML = phonePage.render(player, totalUnread);
            });
            if (window.__tutorialActive) window.dispatchEvent(new Event('tut:phone-entered'));
            TutorialManager.maybeStart();
            break;

        case 'calendar':
            renderPage(() => {
                const player = state.player;
                app.innerHTML = calendarPage.render(player, STATIC_DATA);
                if (calendarPage.init) calendarPage.init();
            });
            break;

        case 'registration':
            renderPage(() => {
                const player = state.player;
                let targetMonth = player.month + 1;
                if (targetMonth > 12) targetMonth = 1;
                const playerRanking = rm.getAllRankings(state.ranking);
                const wtaNpcs = (state.world && state.world.wta) || [];
                const proTotalPts = (playerRanking.ITF || 0) + (playerRanking.WTA || 0);
                const proRank = computeProfessionalRank(proTotalPts, wtaNpcs);
                const wtaRankForGate = proRank !== null ? proRank : 9999;
                const regMatches = getEventsForPlayer(STATIC_DATA, player.age, targetMonth, playerRanking, { WTA: wtaRankForGate });
                app.innerHTML = registrationPage.render(player, regMatches, targetMonth);
                registrationPage.init();
            });
            break;

        case 'ranking':
            renderPage(() => {
                const player = state.player;
                app.innerHTML = rankingPage.render(player);
                rankingPage.init(state.ranking, state.world, player.year, player.month, player);
            });
            break;

        case 'messages':
            renderPage(() => {
                const chats = socialMgr.getAllChats(state.social);
                app.innerHTML = messagesPage.render(chats);
            });
            break;

        case 'chat': {
            const charId = rest[0];
            renderPage(() => {
                const socialData = state.social;
                const charInfo = socialMgr.getChatDetail(socialData, charId);
                if (!charInfo) {
                    location.hash = '#/messages';
                    return;
                }
                // 保存已清零的 unread
                GameState.updateSocial(socialData);
                app.innerHTML = chatDetailPage.render(charId, charInfo);
                chatDetailPage.init();
            });
            break;
        }

        case 'news':
            renderPage(() => {
                const player = state.player;
                const readIds = state.readNews || [];
                const news = getNewsForMonth(NEWS_DATA, player.year, player.month, readIds);
                app.innerHTML = newsPage.renderList(news);
                newsPage.initList();
            });
            break;

        case 'news_detail': {
            const articleId = parseInt(rest[0] || '0', 10);
            renderPage(() => {
                const idx = Math.max(0, Math.min(articleId, NEWS_DATA.length - 1));
                const raw = NEWS_DATA[idx] || null;
                const article = raw ? fillNames(raw, idx) : null;
                app.innerHTML = newsPage.renderDetail(article, idx);
            });
            break;
        }

        case 'saves':
            renderPage(() => {
                const slots = [1, 2, 3].map(n => GameState.getSlotInfo(n));
                const hasGame = !!state;
                app.innerHTML = savePage.render(slots, hasGame);
                savePage.init();
            });
            break;

        default:
            // 未知路由 → 主页
            location.hash = state ? '#/main' : '#/create';
    }
}

function renderPage(fn) {
    // 清理旧的 Bootstrap modals
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    fn();
}

// ========== 游戏事件处理 ==========
function setupGameEvents() {
    // 创建角色
    window.addEventListener('game:create', (e) => {
        const { name, style } = e.detail;
        const player = new TennisGirl(name, '', style);

        // 初始化排名数据（从模板复制）
        const rankingData = JSON.parse(JSON.stringify(BASE_RANKING));
        // 初始化社交数据（从模板复制）
        const socialData = JSON.parse(JSON.stringify(BASE_MESSAGES));
        // 生成动态世界排名
        const worldData = rm.generateDynamicRankings();

        GameState.init(player.toJSON(), rankingData, socialData, worldData);
        window.__isNewGame = true;
        location.hash = '#/main';
    });

    // 报名赛事
    window.addEventListener('game:register', (e) => {
        const tournamentId = parseInt(e.detail.tournamentId, 10);
        const state = GameState.current;
        const player = TennisGirl.fromJSON(state.player);
        const allData = loadTournaments(STATIC_DATA);
        const selectedEvent = findEventById(allData, tournamentId);

        let targetMonth = player.month + 1;
        if (targetMonth > 12) targetMonth = 1;

        // 已报名则不可更改
        if (player.scheduled_tournaments[String(targetMonth)]) {
            location.hash = '#/main';
            return;
        }

        if (selectedEvent) {
            player.applyForTournament(selectedEvent);
            GameState.updatePlayer(player.toJSON());
        }

        location.hash = '#/main';
    });

    // 聊天回复
    window.addEventListener('game:reply', (e) => {
        const { charId, optionIndex } = e.detail;
        const state = GameState.current;
        const socialData = state.social;
        const chats = socialMgr.getAllChats(socialData);
        const options = (chats[charId] && chats[charId].pending_options) || [];
        if (optionIndex < 0 || optionIndex >= options.length) return;

        const optionText = options[optionIndex].text;
        socialMgr.postReply(socialData, charId, optionText);
        GameState.updateSocial(socialData);

        location.hash = `#/chat/${charId}`;
        setTimeout(() => route(), 0);
    });

    // 存档
    window.addEventListener('game:save', (e) => {
        const { slot } = e.detail;
        GameState.saveSlot(slot);
        location.hash = '#/saves';
        // 强制重新渲染
        setTimeout(() => route(), 0);
    });

    // 读档
    window.addEventListener('game:load', (e) => {
        const { slot } = e.detail;
        if (GameState.loadSlot(slot)) {
            location.hash = '#/main';
        } else {
            location.hash = '#/saves';
        }
    });

    // 导出存档
    window.addEventListener('game:export', () => {
        const json = GameState.exportSave();
        if (!json) return;
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tennis_save.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // 导入存档
    window.addEventListener('game:import', (e) => {
        const { json } = e.detail;
        if (GameState.importSave(json)) {
            alert('存档导入成功！');
            location.hash = '#/main';
            setTimeout(() => route(), 0);
        } else {
            alert('存档文件格式错误，导入失败。');
        }
    });
}

// ========== sendPlan 全局函数（供 main_logic.js 调用）==========
window.sendPlan = function () {
    if (window.__tutorialActive) {
        // 教程模式：关闭弹窗但不实际执行计划、不推进月份
        const scheduleModal = document.getElementById('scheduleModal');
        if (scheduleModal) {
            scheduleModal.classList.remove('show');
            scheduleModal.style.display = 'none';
        }
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        window.dispatchEvent(new Event('tut:plan-executed'));
        return;
    }
    const actions = [];
    for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        const item = slot ? slot.children[0] : null;
        if (item) {
            actions.push(item.getAttribute('data-id'));
        }
    }

    const state = GameState.current;
    const player = TennisGirl.fromJSON(state.player);

    if (!player.canAffordActions(actions)) {
        player.log.push("⚠️ 体力预估不足，请重新规划计划。");
        GameState.updatePlayer(player.toJSON());
        location.hash = '#/main';
        route();
        return;
    }

    const allTournaments = loadTournaments(STATIC_DATA);
    const rankingData = state.ranking;
    const socialData = state.social;
    const worldData = state.world;

    // 社交触发回调
    const socialTrigger = (charId, msgId) => {
        socialMgr.triggerProactiveMessage(socialData, charId, msgId);
    };

    // 月份即将推进，把当月新闻标记为已读
    const readIds = state.readNews || [];
    const monthNews = getNewsForMonth(NEWS_DATA, player.year, player.month, readIds);
    const newReadIds = monthNews.length > 0
        ? [...new Set([...readIds, ...monthNews.map(n => n._source_id)])]
        : readIds;

    player.executePlan(actions, allTournaments, rankingData, socialTrigger);
    player.updateTimeAndAge();
    rm.updateWorldNpcs(worldData, player.year, player.month);
    player.ranking_points = rm.refreshRanking(rankingData, player.year, player.month, player.age);
    socialMgr.triggerMonthlyMessages(socialData);

    // 保存所有状态
    GameState.current = {
        player: player.toJSON(),
        ranking: rankingData,
        social: socialData,
        world: worldData,
        readNews: newReadIds
    };

    location.hash = '#/main';
    // 关闭 modal 并刷新页面
    setTimeout(() => route(), 50);
};

// ========== main_logic.js 初始化 ==========
function initMainLogic() {
    // 初始化动作池拖拽
    const pool = document.getElementById('actionPool');
    if (pool && typeof Sortable !== 'undefined') {
        Sortable.create(pool, {
            group: { name: 'tennis', pull: 'clone', put: false },
            sort: false,
            animation: 150
        });
    }

    // 初始化 4 个槽位
    for (let i = 1; i <= 4; i++) {
        const slotEl = document.getElementById(`slot-${i}`);
        if (slotEl && typeof Sortable !== 'undefined') {
            Sortable.create(slotEl, {
                group: 'tennis',
                animation: 150,
                onAdd: function (evt) {
                    const newItem = evt.item;
                    const container = this.el;
                    if (container.children.length > 1) {
                        Array.from(container.children).forEach(child => {
                            if (child !== newItem) container.removeChild(child);
                        });
                    }
                    if (typeof performHit === 'function') performHit();
                    validatePlan();
                },
                onRemove: () => validatePlan()
            });
        }
    }

    // 点击/轻触动作池自动填充槽位
    const actionPool = document.getElementById('actionPool');
    if (actionPool) {
        function handleItemSelect(target) {
            const clickedItem = target.closest('.drag-item');
            if (!clickedItem) return;
            const actionId = clickedItem.getAttribute('data-id');

            if (actionId === 'play_match') {
                const existingMatch = document.querySelector('.target-slot [data-id="play_match"]');
                if (existingMatch) {
                    alert(`${window.PLAYER_NAME}本月已经报过名了，不能参加两场比赛。`);
                    return;
                }
            }

            let targetSlot = null;
            for (let i = 1; i <= 4; i++) {
                const slot = document.getElementById(`slot-${i}`);
                if (slot && slot.children.length === 0) {
                    targetSlot = slot;
                    break;
                }
            }

            if (targetSlot) {
                targetSlot.appendChild(clickedItem.cloneNode(true));
                if (typeof performHit === 'function') performHit();
                validatePlan();
            }
        }

        actionPool.addEventListener('click', (e) => handleItemSelect(e.target));

        let touchMoved = false;
        actionPool.addEventListener('touchstart', () => { touchMoved = false; }, { passive: true });
        actionPool.addEventListener('touchmove', () => { touchMoved = true; }, { passive: true });
        actionPool.addEventListener('touchend', (e) => {
            if (!touchMoved) {
                handleItemSelect(e.target);
                e.preventDefault();
            }
        });
    }

    validatePlan();
}

// ========== 计划验证（全局）==========
window.validatePlan = validatePlan;
function validatePlan() {
    const stamina = window.PLAYER_STAMINA || 100;
    let cost = 0, count = 0;

    for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        const item = slot ? slot.children[0] : null;
        if (item) {
            const id = item.getAttribute('data-id');
            if (id === 'play_match') cost += 50;
            else if (id.startsWith('train_')) cost += (id === 'train_wisdom') ? 20 : 25;
            else cost -= 30;
            count++;
        }
    }

    const btn = document.getElementById('execBtn');
    const warn = document.getElementById('dragWarn');

    if (count === 4) {
        if (stamina >= cost) {
            if (window.__tutorialActive) window.dispatchEvent(new Event('tut:slots-filled'));
            if (btn) btn.disabled = false;
            if (warn) warn.style.display = 'none';
            const currentPlan = [];
            for (let i = 1; i <= 4; i++) {
                const slot = document.getElementById(`slot-${i}`);
                const item = slot ? slot.children[0] : null;
                if (item) currentPlan.push(item.getAttribute('data-id'));
            }
            localStorage.setItem('last_success_plan', JSON.stringify(currentPlan));
        } else {
            if (btn) btn.disabled = true;
            if (warn) {
                warn.innerText = `⚠️ 体力不足，${window.PLAYER_NAME}无法支撑该计划！`;
                warn.style.display = 'block';
            }
        }
    } else {
        if (btn) btn.disabled = true;
        if (warn) warn.style.display = 'none';
    }
}

// ========== 其他全局函数 ==========
window.performHit = function () {
    const img = document.getElementById('player-sprite');
    if (!img) return;
    img.classList.add('hit-animation');
    setTimeout(() => img.classList.remove('hit-animation'), 200);
};

window.clearPlan = function () {
    for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (slot) slot.innerHTML = '';
    }
    validatePlan();
};

window.repeatLast = function () {
    const saved = JSON.parse(localStorage.getItem('last_success_plan') || '["train_tennis","train_tennis","rest","train_tennis"]');

    if (saved.includes('play_match') && !window.HAS_REGISTRATION) {
        alert("⚠️ 规划失败：你上月参加了比赛，但本月尚未报名任何赛事，请重新规划行程。");
        return;
    }

    saved.forEach((id, i) => {
        let el = '';
        if (id === 'play_match') {
            el = `<div class="drag-item match-item" data-id="play_match">🏆 参加比赛 </div>`;
        } else if (id.startsWith('train_')) {
            let label = "🎾 网球训练";
            let colorStyle = "background:#e3f2fd; color:#1976d2;";
            if (id === 'train_wisdom') { label = "📚 录像复盘"; colorStyle = "background:#fff3e0; color:#ef6c00;"; }
            else if (id === 'train_power') { label = "💪 力量专项"; colorStyle = "background:#ffebee; color:#c62828;"; }
            else if (id === 'train_technique') { label = "🎯 技术专项"; colorStyle = "background:#e8f5e9; color:#2e7d32;"; }
            else if (id === 'train_agility') { label = "⚡ 敏捷专项"; colorStyle = "background:#f3e5f5; color:#7b1fa2;"; }
            el = `<div class="drag-item" data-id="${id}" style="${colorStyle}">${label}</div>`;
        } else {
            el = '<div class="drag-item" data-id="rest" style="background:#eeeeee; color:#616161;">💤 休息</div>';
        }
        const slot = document.getElementById(`slot-${i + 1}`);
        if (slot) slot.innerHTML = el;
    });
    validatePlan();
};

// ========== 启动应用 ==========
boot();

// 开发用：控制台运行 resetTutorial() 可重置引导标志
window.resetTutorial = () => {
    localStorage.removeItem('tennis_tutorial_seen');
    console.log('引导已重置，新建游戏即可再次触发');
};
