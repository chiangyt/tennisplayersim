export function render(chats) {
    let chatItems = '';
    for (const [charId, char] of Object.entries(chats)) {
        const lastContent = (char.history && char.history.length > 0) ? char.history[char.history.length - 1].content : '';
        const unreadBadge = char.unread_count > 0
            ? `<div class="unread-badge">${char.unread_count}</div>`
            : '';

        chatItems += `
        <a href="#/chat/${charId}" class="chat-item">
            <div class="avatar-box" style="background: ${char.theme};">
                <i class="bi ${char.avatar_icon} fs-4"></i>
            </div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-bold">${char.name}</span>
                    <span class="small text-muted">${char.last_time}</span>
                </div>
                <div class="chat-preview">${lastContent}</div>
            </div>
            ${unreadBadge}
        </a>`;
    }

    return `
    <div style="flex: 1; height: 100%; display: flex; flex-direction: column; overflow: hidden; background: #fdfaf6;">
        <div class="header-stats d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
                <a href="#/phone" class="text-dark me-3" style="text-decoration:none;"><i class="bi bi-chevron-left fs-4"></i></a>
                <h5 class="mb-0 fw-bold">简讯</h5>
            </div>
            <div class="d-flex gap-3">
                <i class="bi bi-camera fs-5"></i>
                <i class="bi bi-search fs-5"></i>
            </div>
        </div>
        <div class="scroll-content" style="padding: 0;">
            ${chatItems}
        </div>
        <div class="footer-menu" style="grid-template-columns: repeat(4, 1fr);">
            <div class="text-center fw-bold"><i class="bi bi-chat-fill"></i><div style="font-size: 10px;">聊天</div></div>
            <div class="text-center text-muted"><i class="bi bi-compass"></i><div style="font-size: 10px;">发现</div></div>
            <div class="text-center text-muted"><i class="bi bi-people"></i><div style="font-size: 10px;">社区</div></div>
            <div class="text-center text-muted"><i class="bi bi-telephone"></i><div style="font-size: 10px;">通话</div></div>
        </div>
    </div>`;
}
