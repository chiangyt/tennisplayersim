export function render() {
    return `
    <div style="background: var(--bg-color, #fdfaf6); padding-top: 60px; flex: 1; overflow-y: auto;">
    <div class="container text-center" style="max-width: 420px;">
        <h2 class="mb-4 fw-black" style="letter-spacing: 2px; -webkit-text-stroke: 1px black;">🎾 网球运动员模拟器</h2>
        <div class="card" style="border: 3px solid #000; box-shadow: 5px 5px 0px #000; border-radius: 16px; padding: 24px;">
            <form id="createForm">
                <div class="mb-4 text-start">
                    <label class="form-label fw-bold">✨ 主角姓名</label>
                    <input type="text" name="name" class="form-control" placeholder="请输入姓名..." required
                        style="border: 2px solid #000 !important; border-radius: 10px !important; font-weight: bold; padding: 12px;">
                </div>
                <div class="mb-4 text-start">
                    <label class="form-label fw-bold">🎯 打法偏好</label>
                    <div class="form-check p-2 border border-2 border-dark rounded-3 mb-2" style="background: #fff;">
                        <input class="form-check-input ms-0 me-2" type="radio" name="style" id="style1" value="灵巧战术型" checked>
                        <label class="form-check-label" for="style1">灵巧战术型 (手感好/战术多)</label>
                    </div>
                    <div class="form-check p-2 border border-2 border-dark rounded-3 mb-2" style="background: #fff;">
                        <input class="form-check-input ms-0 me-2" type="radio" name="style" id="style2" value="底线力量型">
                        <label class="form-check-label" for="style2">底线力量型 (进攻猛/力量大)</label>
                    </div>
                    <div class="form-check p-2 border border-2 border-dark rounded-3 mb-2" style="background: #fff;">
                        <input class="form-check-input ms-0 me-2" type="radio" name="style" id="style3" value="跑动防守型">
                        <label class="form-check-label" for="style3">跑动防守型 (跑不死/防守硬)</label>
                    </div>
                </div>
                <button type="submit" class="btn w-100" style="background: var(--comic-white) !important; color: #000 !important; border: 3px solid #000 !important; border-radius: 15px !important; padding: 15px; font-weight: 900; font-size: 1.2rem; box-shadow: 4px 4px 0px #000;">开启职业生涯</button>
            </form>
        </div>
        <p class="mt-4 text-muted small fw-bold">--- 进入 12 岁的网球物语 ---</p>
    </div>
    </div>`;
}

export function init() {
    document.getElementById('createForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = e.target.name.value.trim();
        const style = e.target.style.value;
        if (!name) return;
        window.dispatchEvent(new CustomEvent('game:create', { detail: { name, style } }));
    });
}
