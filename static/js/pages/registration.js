export function render(player, currentMatches, targetMonth) {
    let matchesHtml = '';

    if (currentMatches && currentMatches.length > 0) {
        for (const match of currentMatches) {
            const bookedEvent = player.scheduled_tournaments ? player.scheduled_tournaments[String(targetMonth)] : null;
            const isAlreadySigned = bookedEvent && bookedEvent.id === match.id;
            const isTaken = bookedEvent && !isAlreadySigned;

            let isLocked = false;
            if (match.entry_points !== undefined) {
                isLocked = (player.ranking_points || 0) < match.entry_points;
            } else {
                isLocked = player.general_stats < match.req_stats;
            }

            const cardClass = isAlreadySigned ? 'registered-match' : ((isLocked || isTaken) ? 'locked-match' : 'active-match');
            const btnClass = isAlreadySigned ? 'registered' : ((isLocked || isTaken) ? 'locked' : 'active');
            const isDisabled = isLocked || isAlreadySigned || isTaken;

            let thresholdLabel = '';
            if (match.entry_points !== undefined) {
                thresholdLabel = `积分门槛: ${match.entry_points}`;
            } else {
                thresholdLabel = `能力门槛: ${match.req_stats}`;
            }

            let actionLabel = '';
            if (isAlreadySigned) {
                actionLabel = `<i class="bi bi-check-circle-fill"></i> 已报名`;
            } else if (isTaken) {
                actionLabel = `<i class="bi bi-slash-circle"></i> 本月已报名`;
            } else if (isLocked) {
                actionLabel = `<i class="bi bi-lock-fill"></i> 锁定`;
            } else {
                actionLabel = `立即报名 <i class="bi bi-chevron-right"></i>`;
            }

            matchesHtml += `
            <div class="match-box shadow-sm mb-4 ${cardClass}">
                <div class="p-3 border-bottom">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="fw-bold">${match.name}</span>
                            <div class="text-muted small">等级：${match.level_code} | 地点：${match.location}</div>
                        </div>
                        ${isAlreadySigned
                            ? `<span class="badge bg-primary">已预定</span>`
                            : `<span class="points-badge">最高积分 +${match.points[match.points.length - 1]}</span>`
                        }
                    </div>
                </div>
                <div class="p-3">
                    <form class="register-form" data-tournament-id="${match.id}">
                        <input type="hidden" name="tournament_id" value="${match.id}">
                        <button type="submit"
                                class="btn btn-reg w-100 d-flex justify-content-between align-items-center ${btnClass}"
                                ${isDisabled ? 'disabled' : ''}>
                            <span>${thresholdLabel}</span>
                            <span class="fw-bold">${actionLabel}</span>
                        </button>
                    </form>
                </div>
            </div>`;
        }
    }

    return `
    <div class="reg-header d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
            <a href="#/phone" class="text-dark me-3" style="text-decoration:none;">
                <i class="bi bi-chevron-left fs-4" style="-webkit-text-stroke: 1px black;"></i>
            </a>
            <h5 class="mb-0 fw-bold">赛事报名</h5>
        </div>
    </div>
    <div class="scroll-content container py-4">
        <h6 class="fw-bold mb-3 px-1">📅 正在预定：${targetMonth}月 赛事</h6>
        ${matchesHtml}
    </div>`;
}

export function init() {
    document.querySelectorAll('.register-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const tournamentId = form.getAttribute('data-tournament-id');
            window.dispatchEvent(new CustomEvent('game:register', { detail: { tournamentId } }));
        });
    });
}
