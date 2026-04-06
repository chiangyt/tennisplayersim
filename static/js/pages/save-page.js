export function render(slots, hasGame) {
    let slotsHtml = '';

    if (!hasGame) {
        slotsHtml += `
        <div class="text-center py-4 text-muted fw-bold">
            <i class="bi bi-controller fs-1 d-block mb-2"></i>
            没有进行中的游戏，请先新建角色
        </div>`;
    }

    for (const s of slots) {
        if (s.empty) {
            slotsHtml += `
            <div class="slot-card">
                <div class="slot-num" style="font-size: 11px; font-weight: 900; color: #888; letter-spacing: 1px; margin-bottom: 6px;">存档槽 ${s.slot}</div>
                <div class="empty-hint" style="color: #aaa; font-weight: bold; font-size: 15px; margin-bottom: 14px;">— 空存档 —</div>
                ${hasGame ? `
                <button class="btn btn-comic btn-save w-100 save-btn" data-slot="${s.slot}" style="background: #ffd56b; color: #000; border: 3px solid #000 !important; border-radius: 10px !important; font-weight: 900; box-shadow: 3px 3px 0px #000; transition: all 0.1s;">
                    💾 保存到此槽
                </button>` : ''}
            </div>`;
        } else {
            slotsHtml += `
            <div class="slot-card">
                <div class="slot-num" style="font-size: 11px; font-weight: 900; color: #888; letter-spacing: 1px; margin-bottom: 6px;">存档槽 ${s.slot}</div>
                <div class="slot-title" style="font-size: 17px; font-weight: 900; margin-bottom: 4px;">${s.display}</div>
                <div class="slot-time" style="font-size: 12px; color: #888; margin-bottom: 14px;">${s.timestamp}</div>
                <div class="d-flex gap-2">
                    ${hasGame ? `
                    <button class="btn btn-comic btn-save flex-grow-1 save-btn" data-slot="${s.slot}" data-overwrite="true" style="background: #ffd56b; color: #000; border: 3px solid #000 !important; border-radius: 10px !important; font-weight: 900; box-shadow: 3px 3px 0px #000; transition: all 0.1s;">
                        💾 覆盖保存
                    </button>` : ''}
                    <button class="btn btn-comic btn-load flex-grow-1 load-btn" data-slot="${s.slot}" style="background: #85e3ff; color: #000; border: 3px solid #000 !important; border-radius: 10px !important; font-weight: 900; box-shadow: 3px 3px 0px #000; transition: all 0.1s;">
                        📂 读取
                    </button>
                </div>
            </div>`;
        }
    }

    return `
    <style>
        .save-page-wrapper {
            flex: 1;
            height: 100%;
            margin: 0;
            background: #f5f5f5;
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .save-page-wrapper .page-header {
            background: #fff;
            border-bottom: 3px solid #000;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
        }
        .save-page-wrapper .page-header a {
            text-decoration: none;
            color: #000;
            font-size: 22px;
            line-height: 1;
        }
        .save-page-wrapper .page-header h5 {
            margin: 0;
            font-weight: 900;
        }
        .save-page-wrapper .scroll-area {
            flex-grow: 1;
            overflow-y: auto;
            padding: 16px;
            -webkit-overflow-scrolling: touch;
        }
        .save-page-wrapper .slot-card {
            background: #fff;
            border: 3px solid #000;
            border-radius: 16px;
            box-shadow: 5px 5px 0px #000;
            padding: 16px;
            margin-bottom: 16px;
        }
        .save-page-wrapper .btn-comic:active {
            transform: translate(2px, 2px);
            box-shadow: 0 0 0 #000 !important;
        }
    </style>
    <div class="save-page-wrapper">
        <div class="page-header">
            <a href="#/phone"><i class="bi bi-chevron-left"></i></a>
            <h5>💾 存档管理</h5>
        </div>
        <div class="scroll-area">
            ${slotsHtml}
            <div class="slot-card" style="background: #f9f9f9;">
                <div class="slot-num" style="font-size: 11px; font-weight: 900; color: #888; letter-spacing: 1px; margin-bottom: 10px;">📦 存档备份</div>
                <div class="d-flex gap-2">
                    ${hasGame ? `
                    <button id="exportBtn" class="btn btn-comic flex-grow-1" style="background: #b8e994; color: #000; border: 3px solid #000 !important; border-radius: 10px !important; font-weight: 900; box-shadow: 3px 3px 0px #000;">
                        📤 导出存档
                    </button>` : ''}
                    <label class="btn btn-comic flex-grow-1" style="background: #c5a3ff; color: #000; border: 3px solid #000 !important; border-radius: 10px !important; font-weight: 900; box-shadow: 3px 3px 0px #000; cursor: pointer; text-align: center; margin: 0;">
                        📥 导入存档
                        <input type="file" id="importFile" accept=".json" style="display: none;">
                    </label>
                </div>
            </div>
        </div>
    </div>`;
}

export function init() {
    // Attach save button handlers
    document.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const slot = parseInt(btn.getAttribute('data-slot'), 10);
            const isOverwrite = btn.getAttribute('data-overwrite') === 'true';
            if (isOverwrite) {
                if (!confirm('覆盖此存档？')) return;
            }
            window.dispatchEvent(new CustomEvent('game:save', { detail: { slot } }));
        });
    });

    // Attach load button handlers
    document.querySelectorAll('.load-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const slot = parseInt(btn.getAttribute('data-slot'), 10);
            if (!confirm('读取将覆盖当前进度，确认？')) return;
            window.dispatchEvent(new CustomEvent('game:load', { detail: { slot } }));
        });
    });

    // Export save
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('game:export'));
        });
    }

    // Import save
    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                window.dispatchEvent(new CustomEvent('game:import', { detail: { json: ev.target.result } }));
            };
            reader.readAsText(file);
        });
    }
}
