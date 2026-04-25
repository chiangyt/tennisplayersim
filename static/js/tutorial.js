// tutorial.js — 新手引导系统（聚光灯步骤式）
import { GameState } from './game-state.js';

const STEPS = [
    {
        id: 'welcome',
        target: null,
        title: '欢迎来到网球生涯！',
        body: '你将扮演一位12岁的网球少女，从青少年赛场一路冲击WTA职业赛场。\n本教程将带你熟悉第一个月的操作。',
    },
    {
        id: 'stats-bar',
        target: '.header-stats',
        title: '📊 状态栏',
        body: '顶部显示当前年月、年龄和存款。\n⚡体力是安排行动的关键资源（满值100点），😊心情低于 30 时训练收益会打折。',
    },
    {
        id: 'personal-info',
        target: '.footer-menu .btn-menu:nth-child(2)',
        title: '🎾 个人信息',
        body: '点击「个人信息」可查看身高、打法和六维属性。\n\n<b>综合能力</b> 是赛场战力，公式：\n力量+技术+敏捷  ×0.7\n智慧  ×0.2\n毅力  ×0.1\n\n力量/技术/敏捷靠专项训练涨；智慧靠录像复盘；毅力主要靠比赛累积。',
    },
    {
        id: 'open-schedule',
        target: '.footer-menu .btn-menu:first-child',
        title: '📅 行程安排',
        body: '点击"行程安排"，打开本月计划窗口。\n请现在点击它！',
        waitFor: 'tut:schedule-opened',
    },
    {
        id: 'action-pool',
        target: '#actionPool',
        title: '🗂️ 动作库',
        body: '这些是可安排的训练与活动。\n点击或拖拽一个动作，放入下方的周计划槽位。',
        inModal: true,
    },
    {
        id: 'week-slots',
        target: '.schedule-grid',
        title: '🗓️ 四周计划',
        body: '每个槽位代表一周（W1～W4）。\n把4个动作依次拖入，填满四周！',
        waitFor: 'tut:slots-filled',
        inModal: true,
    },
    {
        id: 'exec-btn',
        target: '#execBtn',
        title: '✅ 执行计划',
        body: '四周已全部排好！\n点击"确定执行"推进到下个月。',
        waitFor: 'tut:plan-executed',
        inModal: true,
    },
    {
        id: 'phone-btn',
        target: '.footer-menu .btn-menu:last-child',
        title: '📱 移动终端',
        body: '点击这里进入手机，了解里面的各项功能。\n请现在点击它！',
        waitFor: 'tut:phone-entered',
    },
    {
        id: 'phone-calendar',
        target: 'a[href="#/calendar"]',
        title: '📅 赛历',
        body: '查看全年各级别赛事的举办时间与地点，提前规划参赛路线。',
    },
    {
        id: 'phone-reg',
        target: 'a[href="#/registration"]',
        title: '📝 报名',
        body: '为下个月的比赛报名。\n每月只能参加一场，需在本月内提前完成报名。',
    },
    {
        id: 'phone-msg',
        target: 'a[href="#/messages"]',
        title: '💬 简讯',
        body: '与妈妈、教练、闺蜜聊天，回复可获得少量心情/属性奖励。\n夺冠、上场半决赛、晋级 ITF 等节点会解锁新 NPC（劲敌/同学/赞助商）。',
    },
    {
        id: 'phone-news',
        target: 'a[href="#/news"]',
        title: '📰 资讯',
        body: '浏览网球圈的最新资讯，了解比赛动态和赛场故事。',
    },
    {
        id: 'phone-rank',
        target: 'a[href="#/ranking"]',
        title: '🏆 排名',
        body: '12–14 岁打 CTJ U14 组别（100 位竞争对手）；13 岁起可同时打 ITF Junior（60 人）；14 岁起进入 ITF/WTA 职业（共享 WTA 排名池，30 强榜）。\n积分采用 12 个月滚动 + Best-of-N 择优。',
    },
    {
        id: 'phone-shop',
        target: 'a[href="#/shop"]',
        title: '🛒 商城 / 背包',
        body: '比赛奖金可用于购买消耗品（回体力/心情）和礼物。\n礼物送给 NPC 会触发专属剧情，并收到对应回礼放进背包。',
    },
    {
        id: 'done',
        target: null,
        title: '🎉 入门完成！',
        body: '你已了解所有核心功能。\n点击手机底部的 Home 键返回，正式开始你的职业生涯！',
        isLast: true,
    },
];

let currentStep = -1;
let waitEventName = null;
let waitListener = null;

function _injectDOM() {
    if (document.getElementById('tut-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'tut-overlay';
    overlay.innerHTML =
        '<div class="tut-panel" id="tut-top"></div>' +
        '<div class="tut-panel" id="tut-left"></div>' +
        '<div class="tut-panel" id="tut-right"></div>' +
        '<div class="tut-panel" id="tut-bottom"></div>';
    document.body.appendChild(overlay);

    const tooltip = document.createElement('div');
    tooltip.id = 'tut-tooltip';
    tooltip.innerHTML =
        '<div class="tut-progress" id="tut-progress"></div>' +
        '<div class="tut-title" id="tut-title-text"></div>' +
        '<div class="tut-body" id="tut-body-text"></div>' +
        '<div class="tut-actions">' +
        '<button class="tut-btn-skip" id="tut-skip">跳过</button>' +
        '<button class="tut-btn-next" id="tut-next">下一步 →</button>' +
        '</div>';
    document.body.appendChild(tooltip);

    document.getElementById('tut-skip').addEventListener('click', () => TutorialManager.skip());
    document.getElementById('tut-next').addEventListener('click', () => TutorialManager._advance());
    document.addEventListener('keydown', _onKeyDown);
}

function _onKeyDown(e) {
    if (e.key === 'Escape' && window.__tutorialActive) TutorialManager.skip();
}

function _clearWaitListener() {
    if (waitListener && waitEventName) {
        window.removeEventListener(waitEventName, waitListener);
    }
    waitListener = null;
    waitEventName = null;
}

function _clearSpotlight() {
    document.querySelectorAll('.tut-spotlight-el').forEach(el => {
        el.classList.remove('tut-spotlight-el');
        el.style.position = el.dataset.tutOrigPos || '';
        el.style.zIndex = el.dataset.tutOrigZ || '';
        el.style.pointerEvents = el.dataset.tutOrigPE || '';
        delete el.dataset.tutOrigPos;
        delete el.dataset.tutOrigZ;
        delete el.dataset.tutOrigPE;
    });
}

function _showStep(index) {
    const step = STEPS[index];
    if (!step) return;

    _clearSpotlight();
    _clearWaitListener();

    document.getElementById('tut-title-text').textContent = step.title;
    document.getElementById('tut-body-text').innerHTML = step.body.replace(/\n/g, '<br>');
    document.getElementById('tut-progress').textContent = `${index + 1} / ${STEPS.length}`;

    const nextBtn = document.getElementById('tut-next');
    const skipBtn = document.getElementById('tut-skip');
    if (step.isLast) {
        nextBtn.textContent = '开始游戏 🎾';
        nextBtn.disabled = false;
        skipBtn.style.display = 'none';
    } else {
        nextBtn.textContent = step.waitFor ? '等待操作...' : '下一步 →';
        nextBtn.disabled = !!step.waitFor;
        skipBtn.style.display = '';
    }

    const tooltip = document.getElementById('tut-tooltip');
    const panels = document.querySelectorAll('.tut-panel');

    const noOverlay = step.inModal || step.inPhone;
    if (noOverlay) {
        panels.forEach(p => { p.style.display = 'none'; });
    } else {
        panels.forEach(p => { p.style.display = 'block'; });
        if (step.target) {
            const targetEl = document.querySelector(step.target);
            if (targetEl) {
                _positionPanels(targetEl);
            } else {
                _fullOverlay();
            }
        } else {
            _fullOverlay();
        }
    }

    if (step.target) {
        const targetEl = document.querySelector(step.target);
        if (targetEl) {
            targetEl.classList.add('tut-spotlight-el');
            if (!noOverlay) {
                targetEl.dataset.tutOrigPos = targetEl.style.position;
                targetEl.dataset.tutOrigZ = targetEl.style.zIndex;
                targetEl.style.position = 'relative';
                targetEl.style.zIndex = '10001';
                // 仅需用户操作的步骤（waitFor）才允许点击目标，其余锁住防止误入
                if (!step.waitFor) {
                    targetEl.dataset.tutOrigPE = targetEl.style.pointerEvents;
                    targetEl.style.pointerEvents = 'none';
                }
            }
            _positionTooltipNear(targetEl, tooltip);
        } else {
            _centerTooltip(tooltip);
        }
    } else {
        _centerTooltip(tooltip);
    }

    if (step.waitFor) {
        waitEventName = step.waitFor;
        waitListener = () => {
            waitListener = null;
            waitEventName = null;
            TutorialManager._advance();
        };
        window.addEventListener(step.waitFor, waitListener, { once: true });
    }

    if (step.id === 'open-schedule') {
        const modal = document.getElementById('scheduleModal');
        if (modal) {
            modal.addEventListener('shown.bs.modal', () => {
                window.dispatchEvent(new Event('tut:schedule-opened'));
            }, { once: true });
        }
    }
}

function _positionPanels(targetEl) {
    const r = targetEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 6;

    document.getElementById('tut-top').style.cssText =
        `top:0;left:0;width:${vw}px;height:${Math.max(0, r.top - pad)}px`;
    document.getElementById('tut-left').style.cssText =
        `top:${Math.max(0, r.top - pad)}px;left:0;width:${Math.max(0, r.left - pad)}px;height:${r.height + pad * 2}px`;
    document.getElementById('tut-right').style.cssText =
        `top:${Math.max(0, r.top - pad)}px;left:${r.right + pad}px;width:${vw}px;height:${r.height + pad * 2}px`;
    document.getElementById('tut-bottom').style.cssText =
        `top:${r.bottom + pad}px;left:0;width:${vw}px;height:${vh}px`;
}

function _fullOverlay() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    document.getElementById('tut-top').style.cssText =
        `top:0;left:0;width:${vw}px;height:${vh}px`;
    ['tut-left', 'tut-right', 'tut-bottom'].forEach(id => {
        document.getElementById(id).style.cssText = 'display:none';
    });
}

function _positionTooltipNear(targetEl, tooltip) {
    const r = targetEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 14;
    const tooltipW = Math.min(280, vw - 16);
    const tooltipH = 190;

    let top, left;
    if (r.bottom + gap + tooltipH <= vh) {
        top = r.bottom + gap;
    } else {
        top = Math.max(8, r.top - gap - tooltipH);
    }
    left = r.left + r.width / 2 - tooltipW / 2;
    left = Math.max(8, Math.min(vw - tooltipW - 8, left));

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
    tooltip.style.transform = '';
    tooltip.style.width = tooltipW + 'px';
}

function _centerTooltip(tooltip) {
    const vw = window.innerWidth;
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
    tooltip.style.width = Math.min(300, vw - 32) + 'px';
}

export const TutorialManager = {
    maybeStart() {
        if (window.__tutorialActive && currentStep >= 0) {
            this._reattach();
            return;
        }
        if (GameState.tutorialSeen) return;
        if (!window.__isNewGame) return;
        window.__isNewGame = false;
        this._begin();
    },

    _begin() {
        window.__tutorialActive = true;
        currentStep = 0;
        _injectDOM();
        _showStep(0);
    },

    _advance() {
        if (!window.__tutorialActive) return;
        const step = STEPS[currentStep];
        if (step && step.isLast) {
            this.skip();
            return;
        }
        currentStep++;
        if (currentStep >= STEPS.length) {
            this.skip();
            return;
        }
        _showStep(currentStep);
    },

    skip() {
        window.__tutorialActive = false;
        _clearWaitListener();
        _clearSpotlight();
        const overlay = document.getElementById('tut-overlay');
        const tooltip = document.getElementById('tut-tooltip');
        if (overlay) overlay.remove();
        if (tooltip) tooltip.remove();
        document.removeEventListener('keydown', _onKeyDown);
        currentStep = -1;
        GameState.markTutorialSeen();
    },

    _reattach() {
        _injectDOM();
        if (currentStep >= 0 && currentStep < STEPS.length) {
            _showStep(currentStep);
        }
    }
};
