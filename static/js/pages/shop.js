export function render(player, shopData) {
    const consumables = shopData.consumables || [];
    const gifts = shopData.gifts || [];
    const purchasedGifts = player.purchased_gifts || [];

    const renderConsumable = (item) => {
        const owned = (player.inventory && player.inventory[item.id]) || 0;
        const canAfford = player.money >= item.price;
        return `
        <div class="shop-item d-flex align-items-center p-3 mb-2" style="background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.07);">
            <div style="font-size: 2rem; width: 48px; text-align: center;">${item.icon}</div>
            <div class="flex-grow-1 ms-3">
                <div class="fw-bold">${item.name}</div>
                <div class="small text-muted">${item.description}</div>
                <div class="small" style="color: #888;">持有：${owned}</div>
            </div>
            <div class="text-end">
                <div class="fw-bold mb-1" style="color: #27ae60;">¥${item.price.toLocaleString()}</div>
                <button class="btn btn-sm btn-primary px-3"
                    style="border-radius: 20px; font-size: 12px;"
                    ${canAfford ? '' : 'disabled'}
                    onclick="window.dispatchEvent(new CustomEvent('game:buy', { detail: { itemId: '${item.id}' } }))">
                    ${canAfford ? '购买' : '余额不足'}
                </button>
            </div>
        </div>`;
    };

    const renderGift = (item) => {
        const soldOut = purchasedGifts.includes(item.id);
        const canAfford = !soldOut && player.money >= item.price;
        const cardStyle = soldOut
            ? 'background: #f0f0f0; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); opacity: 0.6;'
            : 'background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.07);';
        const btnHtml = soldOut
            ? `<button class="btn btn-sm px-3" style="border-radius: 20px; font-size: 12px; background: #ccc; color: #888; cursor: not-allowed;" disabled>Sold Out</button>`
            : `<button class="btn btn-sm btn-primary px-3"
                style="border-radius: 20px; font-size: 12px;"
                ${canAfford ? '' : 'disabled'}
                onclick="window.dispatchEvent(new CustomEvent('game:buy', { detail: { itemId: '${item.id}' } }))">
                ${canAfford ? '购买' : '余额不足'}
               </button>`;
        return `
        <div class="shop-item d-flex align-items-center p-3 mb-2" style="${cardStyle}">
            <div style="font-size: 2rem; width: 48px; text-align: center;">${item.icon}</div>
            <div class="flex-grow-1 ms-3">
                <div class="d-flex align-items-center gap-2">
                    <span class="fw-bold">${item.name}</span>
                    ${soldOut ? '<span style="font-size: 10px; background: #bbb; color: #fff; border-radius: 4px; padding: 1px 6px; font-weight: bold; letter-spacing: 0.05em;">SOLD OUT</span>' : ''}
                </div>
                <div class="small text-muted">${item.description}</div>
            </div>
            <div class="text-end">
                <div class="fw-bold mb-1" style="color: ${soldOut ? '#aaa' : '#27ae60'};">¥${item.price.toLocaleString()}</div>
                ${btnHtml}
            </div>
        </div>`;
    };

    return `
    <div style="flex: 1; height: 100%; display: flex; flex-direction: column; overflow: hidden; background: #fdfaf6;">
        <div class="header-stats d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
                <a href="#/phone" class="text-dark me-3" style="text-decoration:none;"><i class="bi bi-chevron-left fs-4"></i></a>
                <h5 class="mb-0 fw-bold">🛍️ 商城</h5>
            </div>
            <div class="fw-bold" style="color: #27ae60;">💰 ¥${player.money.toLocaleString()}</div>
        </div>
        <div class="scroll-content">
            <div class="px-3 pt-3 pb-1">
                <div class="text-muted small fw-bold mb-2" style="letter-spacing: 0.05em;">— 消耗品 —</div>
                ${consumables.map(renderConsumable).join('')}
            </div>
            <div class="px-3 pt-2 pb-3">
                <div class="text-muted small fw-bold mb-2" style="letter-spacing: 0.05em;">— 礼物 —</div>
                ${[...gifts].sort((a, b) => purchasedGifts.includes(a.id) - purchasedGifts.includes(b.id)).map(renderGift).join('')}
            </div>
        </div>
    </div>`;
}

export function init() {}
