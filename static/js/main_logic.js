// static/js/main_logic.js
document.addEventListener('DOMContentLoaded', function() {
    const box = document.getElementById('logBox');
    if (box) box.scrollTop = box.scrollHeight;

    // 1. 初始化动作池 (从这里往外拖)
    const pool = document.getElementById('actionPool');
    if (pool) {
        Sortable.create(pool, {
            group: { name: 'tennis', pull: 'clone', put: false }, // 只能克隆出去，不能往回拖
            sort: false,
            animation: 150
        });
    }

    // 2. 初始化 4 个槽位 (接收拖入)
    for (let i = 1; i <= 4; i++) {
        const slotEl = document.getElementById(`slot-${i}`);
        if (slotEl) {
            Sortable.create(slotEl, {
                group: 'tennis',
                animation: 150,
                onAdd: function(evt) {
                    const newItem = evt.item; // 刚刚拖进来的新框
                    const container = this.el; // 当前的 W 槽位

                    // 覆盖逻辑：如果槽位里有超过1个东西，就把旧的删掉
                    if (container.children.length > 1) {
                        Array.from(container.children).forEach(child => {
                            // 只要不是刚拖进来的那个新选项，全部清除掉
                            if (child !== newItem) {
                                container.removeChild(child);
                            }
                        });
                    }

                    // 更新校验（比如体力计算）
                    if (typeof performHit === 'function') performHit();
                    validatePlan();
                },
                onRemove: () => validatePlan()
            });
        }
    }

    // 3. 点击/轻触动作池自动按顺序填充槽位
    const actionPool = document.getElementById('actionPool');
    if (actionPool) {
        // 核心选择逻辑（点击和触摸共用）
        function handleItemSelect(target) {
            const clickedItem = target.closest('.drag-item');
            if (!clickedItem) return;

            const actionId = clickedItem.getAttribute('data-id');

            // A. 拦截重复比赛逻辑
            if (actionId === 'play_match') {
                const existingMatch = document.querySelector('.target-slot [data-id="play_match"]');
                if (existingMatch) {
                    alert(`${PLAYER_NAME}本月已经报过名了，不能参加两场比赛。`);
                    return;
                }
            }

            // B. 寻找第一个空的槽位
            let targetSlot = null;
            for (let i = 1; i <= 4; i++) {
                const slot = document.getElementById(`slot-${i}`);
                if (slot && slot.children.length === 0) {
                    targetSlot = slot;
                    break;
                }
            }

            // C. 填充空槽位
            if (targetSlot) {
                targetSlot.appendChild(clickedItem.cloneNode(true));
                if (typeof performHit === 'function') performHit();
                validatePlan();
            }
        }

        // 桌面/DevTools 模拟：用 click 事件
        actionPool.addEventListener('click', function(e) {
            handleItemSelect(e.target);
        });

        // 真实手机：SortableJS 会拦截 touchstart 导致 click 不触发
        // 用 touchmove 区分「轻触」和「拖动」，轻触时手动执行选择逻辑
        let touchMoved = false;
        actionPool.addEventListener('touchstart', function() {
            touchMoved = false;
        }, { passive: true });
        actionPool.addEventListener('touchmove', function() {
            touchMoved = true;
        }, { passive: true });
        actionPool.addEventListener('touchend', function(e) {
            if (!touchMoved) {
                // 是轻触而非拖动，执行选择
                handleItemSelect(e.target);
                // 阻止 click 事件重复触发
                e.preventDefault();
            }
        });
    }
    validatePlan();
});

// 验证计划并更新人物状态
function validatePlan() {
    let stamina = PLAYER_STAMINA;
    let cost = 0, count = 0, currentPlan = [];

    for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        const item = slot ? slot.children[0] : null;
        if (item) {
            const id = item.getAttribute('data-id');
            // 同步后端逻辑：录像-20，其他-25，比赛-50
            if (id === 'play_match') {
                cost += 50;
            } else if (id.startsWith('train_')) {
                cost += (id === 'train_wisdom') ? 20 : 25;
            } else {
                cost -= 30; // 休息
            }
            count++;
            currentPlan.push(id);
        }
    }

    // 更新按钮与提示状态
    const btn = document.getElementById('execBtn');
    const warn = document.getElementById('dragWarn');

    if (count === 4) {
        if (stamina >= cost) {
            btn.disabled = false;
            if (warn) warn.style.display = 'none';
            localStorage.setItem('last_success_plan', JSON.stringify(currentPlan));
        } else {
            btn.disabled = true;
            if (warn) {
                warn.innerText = `⚠️ 体力不足，${PLAYER_NAME}无法支撑该计划！`;
                warn.style.display = 'block';
            }
        }
    } else {
        btn.disabled = true;
        if (warn) warn.style.display = 'none';
    }
}

// 击球动画
function performHit() {
    const img = document.getElementById('player-sprite');
    if (!img) return;
    img.classList.add('hit-animation');
    setTimeout(() => img.classList.remove('hit-animation'), 200);
}

// 清空计划
function clearPlan() {
    for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (slot) slot.innerHTML = '';
    }
    validatePlan();
}

// 重复上月逻辑
function repeatLast() {
    const saved = JSON.parse(localStorage.getItem('last_success_plan') || '["train_tennis","train_tennis","rest","train_tennis"]');

    // 校验：若计划有比赛但本月未报名（使用 main.html 传来的常量）
    if (saved.includes('play_match') && !HAS_REGISTRATION) {
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

        const slot = document.getElementById(`slot-${i+1}`);
        if (slot) slot.innerHTML = el;
    });
    validatePlan();
}

// 提交行程
function sendPlan() {
    const data = new FormData();
    for (let i = 1; i <= 4; i++) {
        const item = document.getElementById(`slot-${i}`).children[0];
        data.append('actions', item.getAttribute('data-id'));
    }
    fetch('/schedule', { method: 'POST', body: data }).then(() => window.location.href='/main');
}

function openModal(id) {
    const modalEl = document.getElementById(id);
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}
