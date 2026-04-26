function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

export function render(player) {
    const memories = (player.memories || [])
        .filter(memory => memory && memory.image)
        .slice()
        .reverse();

    const content = memories.length > 0
        ? memories.map((memory, index) => `
            <article class="memory-card" onclick="window._memoryShow(${index})">
                <img class="memory-thumb" src="${escapeHtml(memory.image)}" alt="${escapeHtml(memory.title || '回忆')}">
                <div class="memory-body">
                    <div class="memory-meta">${escapeHtml(memory.year)}年${escapeHtml(memory.month)}月</div>
                    <h6>${escapeHtml(memory.title || '未命名回忆')}</h6>
                </div>
            </article>
        `).join('')
        : `<div class="log-item text-center py-5 text-muted fw-bold">还没有解锁图片回忆</div>`;

    return `
    <style>
        .memories-page {
            flex: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #fdfaf6;
        }
        .memories-list {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            padding-bottom: 80px;
        }
        .memory-card {
            background: #fff;
            border: 3px solid #000;
            border-radius: 14px;
            box-shadow: 4px 4px 0 #000;
            margin-bottom: 16px;
            padding: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            transition: transform 0.08s, box-shadow 0.08s;
        }
        .memory-card:active {
            transform: translate(3px, 3px);
            box-shadow: 1px 1px 0 #000;
        }
        .memory-thumb {
            width: 70px;
            height: 70px;
            object-fit: cover;
            display: block;
            border: 3px solid #000;
            border-radius: 12px;
            flex-shrink: 0;
        }
        .memory-body {
            min-width: 0;
        }
        .memory-meta {
            font-size: 12px;
            color: #666;
            font-weight: 900;
            margin-bottom: 6px;
        }
        .memory-body h6 {
            margin: 0;
            font-size: 16px;
            font-weight: 900;
        }
        .memory-overlay {
            position: fixed;
            inset: 0;
            z-index: 9200;
            background: rgba(0,0,0,0.65);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 14px;
        }
        .memory-detail {
            width: min(380px, 100%);
            max-height: 88vh;
            overflow-y: auto;
            background: #fff;
            border: 4px solid #000;
            border-radius: 16px;
            box-shadow: 7px 7px 0 #000;
            padding: 14px;
        }
        .memory-detail img {
            width: 100%;
            display: block;
            border: 3px solid #000;
            border-radius: 10px;
            margin-bottom: 12px;
        }
        .memory-detail h6 {
            font-size: 18px;
            font-weight: 900;
            margin: 0 0 8px;
        }
        .memory-detail p {
            margin: 0 0 12px;
            font-size: 14px;
            font-weight: 700;
            line-height: 1.7;
        }
        .memory-close {
            width: 100%;
            border: 3px solid #000;
            border-radius: 12px;
            background: #ffd56b;
            box-shadow: 3px 3px 0 #000;
            padding: 10px 12px;
            font-weight: 900;
        }
    </style>
    <div class="memories-page">
        <div class="header-stats d-flex align-items-center">
            <a href="#/phone" class="text-dark me-3" style="text-decoration:none; font-size: 24px; font-weight: 900;">&lt;</a>
            <h5 class="mb-0 fw-bold">图片回忆</h5>
        </div>
        <div class="memories-list">
            ${content}
        </div>
    </div>`;
}

export function init(player) {
    const memories = (player.memories || [])
        .filter(memory => memory && memory.image)
        .slice()
        .reverse();

    window._memoryShow = function(index) {
        const memory = memories[index];
        if (!memory) return;
        document.getElementById('memory-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.id = 'memory-overlay';
        overlay.className = 'memory-overlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) window._memoryClose();
        });
        overlay.innerHTML = `
            <div class="memory-detail">
                <img src="${escapeHtml(memory.image)}" alt="${escapeHtml(memory.title || '回忆')}">
                <div class="memory-meta">${escapeHtml(memory.year)}年${escapeHtml(memory.month)}月</div>
                <h6>${escapeHtml(memory.title || '未命名回忆')}</h6>
                <p>${escapeHtml(memory.content || '')}</p>
                <button class="memory-close" onclick="window._memoryClose()">关闭</button>
            </div>`;
        document.body.appendChild(overlay);
    };

    window._memoryClose = function() {
        document.getElementById('memory-overlay')?.remove();
    };
}
