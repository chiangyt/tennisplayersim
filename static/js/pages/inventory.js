export function render(player, shopData, unlockedNpcIds) {
    const allItems = [...(shopData.consumables || []), ...(shopData.gifts || [])];
    const inventory = player.inventory || {};
    const ownedIds = Object.keys(inventory).filter(id => inventory[id] > 0);

    if (ownedIds.length === 0) {
        return `
        <div style="flex: 1; height: 100%; display: flex; flex-direction: column; overflow: hidden; background: #fdfaf6;">
            <div class="header-stats d-flex align-items-center">
                <a href="#/phone" class="text-dark me-3" style="text-decoration:none;"><i class="bi bi-chevron-left fs-4"></i></a>
                <h5 class="mb-0 fw-bold">🎒 背包</h5>
            </div>
            <div class="scroll-content d-flex align-items-center justify-content-center" style="flex: 1;">
                <div class="text-center text-muted">
                    <div style="font-size: 3rem; margin-bottom: 12px;">🎒</div>
                    <div>背包里空空如也</div>
                    <div class="small mt-1">去商城逛逛吧</div>
                    <a href="#/shop" class="btn btn-sm btn-outline-secondary mt-3" style="border-radius: 20px;">前往商城</a>
                </div>
            </div>
        </div>`;
    }

    const consumables = (shopData.consumables || []).filter(item => inventory[item.id] > 0);
    const gifts = (shopData.gifts || []).filter(item => inventory[item.id] > 0);

    const renderConsumable = (item) => {
        const count = inventory[item.id] || 0;
        return `
        <div class="d-flex align-items-center p-3 mb-2" style="background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.07);">
            <div style="font-size: 2rem; width: 48px; text-align: center;">${item.icon}</div>
            <div class="flex-grow-1 ms-3">
                <div class="fw-bold">${item.name}</div>
                <div class="small text-muted">${item.description}</div>
                <div class="small" style="color: #888;">×${count}</div>
            </div>
            <button class="btn btn-sm btn-success px-3"
                style="border-radius: 20px; font-size: 12px;"
                onclick="window.dispatchEvent(new CustomEvent('game:use_item', { detail: { itemId: '${item.id}' } }))">
                立即使用
            </button>
        </div>`;
    };

    const renderGift = (item) => {
        const count = inventory[item.id] || 0;
        const isUnlocked = unlockedNpcIds.includes(item.target_npc);
        return `
        <div class="d-flex align-items-center p-3 mb-2" style="background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.07);">
            <div style="font-size: 2rem; width: 48px; text-align: center;">${item.icon}</div>
            <div class="flex-grow-1 ms-3">
                <div class="fw-bold">${item.name}</div>
                <div class="small text-muted">${item.description}</div>
                <div class="small" style="color: #888;">×${count}${isUnlocked ? '' : ' · 收件人未解锁'}</div>
            </div>
            <button class="btn btn-sm btn-warning px-3"
                style="border-radius: 20px; font-size: 12px;"
                ${isUnlocked ? '' : 'disabled'}
                onclick="window.dispatchEvent(new CustomEvent('game:send_gift', { detail: { itemId: '${item.id}' } }))">
                送出
            </button>
        </div>`;
    };

    const consumableSection = consumables.length > 0
        ? `<div class="px-3 pt-3 pb-1">
            <div class="text-muted small fw-bold mb-2" style="letter-spacing: 0.05em;">— 消耗品 —</div>
            ${consumables.map(renderConsumable).join('')}
           </div>`
        : '';

    const giftSection = gifts.length > 0
        ? `<div class="px-3 pt-2 pb-3">
            <div class="text-muted small fw-bold mb-2" style="letter-spacing: 0.05em;">— 礼物 —</div>
            ${gifts.map(renderGift).join('')}
           </div>`
        : '';

    return `
    <div style="flex: 1; height: 100%; display: flex; flex-direction: column; overflow: hidden; background: #fdfaf6;">
        <div class="header-stats d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
                <a href="#/phone" class="text-dark me-3" style="text-decoration:none;"><i class="bi bi-chevron-left fs-4"></i></a>
                <h5 class="mb-0 fw-bold">🎒 背包</h5>
            </div>
            <a href="#/shop" class="text-muted small" style="text-decoration:none;">去商城 →</a>
        </div>
        <div class="scroll-content">
            ${consumableSection}
            ${giftSection}
        </div>
    </div>`;
}

export function init() {}
