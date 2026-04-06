export function render(charId, char) {
    let messagesHtml = '';
    if (char.history) {
        for (const msg of char.history) {
            const rowClass = msg.role === 'me' ? 'me' : 'other';
            const avatarBg = msg.role === 'other' ? char.theme : 'var(--color-yellow)';
            const avatarIcon = msg.role === 'other' ? char.avatar_icon : 'bi-person-fill';
            let imageHtml = '';
            if (msg.image_url) {
                imageHtml = `<img src="${msg.image_url}" style="max-width: 100%; border-radius: 10px; margin-top: 8px;">`;
            }
            messagesHtml += `
            <div class="message-row ${rowClass}">
                <div class="avatar-box" style="background: ${avatarBg};">
                    <i class="bi ${avatarIcon} fs-4"></i>
                </div>
                <div class="msg-bubble">
                    ${msg.content}
                    ${imageHtml}
                </div>
            </div>`;
        }
    }

    let inputBarText = '';
    let inputBarClass = 'text-muted';
    if (char.pending_title) {
        inputBarText = char.pending_title;
        inputBarClass = 'text-dark';
    } else if (char.pending_options) {
        inputBarText = '有新消息待回复...';
    } else {
        inputBarText = '暂无回复内容...';
    }

    let trayContent = '';
    if (char.pending_options && char.pending_options.length > 0) {
        const optionsHtml = char.pending_options.map((opt, idx) => `
            <a href="#" class="btn-reply-comic reply-option" data-char-id="${charId}" data-option-index="${idx}">
                ${opt.text}
            </a>
        `).join('');
        trayContent = `<div class="d-flex flex-column gap-3">${optionsHtml}</div>`;
    } else {
        trayContent = `
            <div class="text-center py-4">
                <i class="bi bi-chat-dots fs-1 text-muted d-block mb-2"></i>
                <p class="fw-bold text-muted">目前没有可回复的内容...</p>
            </div>`;
    }

    return `
    <style>
        .chat-detail-page {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 50;
        }
        .chat-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            background: #fdfaf6;
            overflow: hidden;
        }
        .message-row {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 25px;
            width: 100%;
        }
        .message-row.other { flex-direction: row; }
        .message-row.me { flex-direction: row-reverse; }
        .chat-detail-page .avatar-box {
            width: 45px; height: 45px;
            border: 3px solid #000;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: #fff;
        }
        .msg-bubble {
            max-width: 70%;
            padding: 12px 15px;
            border: 3px solid #000;
            border-radius: 18px;
            font-weight: bold;
            box-shadow: 4px 4px 0px #000;
            position: relative;
            word-break: break-all;
        }
        .other .msg-bubble { background: #fff; border-top-left-radius: 2px; }
        .me .msg-bubble { background: var(--chat-theme-color, #85e3ff); border-top-right-radius: 2px; }
        .chat-header { flex-shrink: 0; border-bottom: 3px solid #000; background: #fff; z-index: 10; }
        .chat-main {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding: 20px 15px;
        }
        .chat-footer { flex-shrink: 0; border-top: 3px solid #000; background: #fff; padding: 12px; }
        .chat-footer-wrapper {
            flex-shrink: 0;
            background: #fff;
            border-top: 3px solid #000;
            position: relative;
            z-index: 20;
        }
        .input-bar-trigger {
            cursor: pointer;
            background: #fff;
            position: relative;
            z-index: 2;
        }
        .tray-arrow {
            transition: transform 0.3s;
        }
        .active .tray-arrow {
            transform: rotate(180deg);
        }
        .tray-content {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 100%;
            background: #f8f8f8;
            border-top: 2px dashed #ccc;
            box-shadow: 0 -6px 20px rgba(0,0,0,0.08);
            overflow-y: auto;
            max-height: min(40vh, 300px);
            padding: 12px;
            opacity: 0;
            pointer-events: none;
            transform: translateY(8px);
            transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .chat-footer-wrapper.active .tray-content {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
        }
        .btn-reply-comic {
            background: #fff;
            border: 3px solid #000 !important;
            border-radius: 12px;
            padding: 12px;
            font-weight: 900;
            text-align: center;
            text-decoration: none !important;
            color: #000 !important;
            box-shadow: 4px 4px 0px #000;
            margin-bottom: 10px;
            display: block;
            transition: all 0.1s ease;
        }
        .btn-reply-comic:active {
            transform: translate(2px, 2px);
            box-shadow: 0px 0px 0px #000;
        }
    </style>
    <div class="chat-detail-page chat-${charId}">
        <div class="chat-wrapper">
            <div class="chat-header p-3 d-flex align-items-center">
                <a href="#/messages" class="text-dark me-3"><i class="bi bi-chevron-left fs-4" style="-webkit-text-stroke: 1px black;"></i></a>
                <h5 class="mb-0 fw-bold">${char.name}</h5>
            </div>
            <div class="chat-main">
                ${messagesHtml}
            </div>
            <div class="chat-footer-wrapper" id="replyTray">
                <div class="input-bar-trigger d-flex align-items-center gap-2 p-3" onclick="toggleTray()">
                    <i class="bi bi-mic fs-4"></i>
                    <div class="flex-grow-1 border border-3 border-dark rounded-pill px-3 py-1 fw-bold bg-light ${inputBarClass}" style="font-size: 14px;">
                        ${inputBarText}
                    </div>
                    <i class="bi bi-chevron-up fs-4 tray-arrow" id="trayArrow"></i>
                </div>
                <div class="tray-content">
                    ${trayContent}
                </div>
            </div>
        </div>
    </div>
    `;
}

export function init() {
    // Make toggleTray globally available
    window.toggleTray = function() {
        const tray = document.getElementById('replyTray');
        if (tray) tray.classList.toggle('active');
    };

    // Scroll to bottom of chat
    const chatMain = document.querySelector('.chat-main');
    if (chatMain) chatMain.scrollTop = chatMain.scrollHeight;

    // Attach reply option click handlers
    document.querySelectorAll('.reply-option').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const charId = el.getAttribute('data-char-id');
            const optionIndex = parseInt(el.getAttribute('data-option-index'), 10);
            window.dispatchEvent(new CustomEvent('game:reply', { detail: { charId, optionIndex } }));
        });
    });
}
