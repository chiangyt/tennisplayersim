const _ITF_JUNIOR_ENTRY_POINTS = {
    'J500': 700,
    'J300': 350,
    'J200': 150,
    'J100': 60,
    'J60': 0,
    'J30': 0,
};

/**
 * 返回预加载的静态赛事数据（在 SPA 中数据已在启动时 fetch 完成）
 * @param {object} staticData - { CTJ: {...}, ITF_Junior: {...}, ITF: {...}, WTA: {...} }
 * @returns {object}
 */
export function loadTournaments(staticData) {
    return staticData;
}

/**
 * 根据玩家年龄、月份和积分筛选可报名赛事
 * @param {object} allData - 全部赛事数据
 * @param {number} age
 * @param {number} month
 * @param {object} [playerRanking] - { CTJ: number, ITF_Junior: number, ITF: number, WTA: number }
 * @returns {object[]}
 */
export function getEventsForPlayer(allData, age, month, playerRanking, rankingPositions = {}) {
    let allowedSystems;
    if (age < 13) {
        allowedSystems = ["CTJ"];
    } else if (age === 13) {
        allowedSystems = ["CTJ", "ITF_Junior"];
    } else {
        allowedSystems = ["ITF_Junior", "ITF", "WTA"];
    }

    if (!playerRanking) playerRanking = {};

    const matches = [];
    for (const systemKey of allowedSystems) {
        const targetSystem = allData[systemKey] || {};

        for (const levelEvents of Object.values(targetSystem)) {
            if (Array.isArray(levelEvents)) {
                for (const event of levelEvents) {
                    if (typeof event === 'object' && event !== null && event.month === month) {
                        const req = event.req_ranking || 0;
                        let rankLocked = false;
                        if (req > 0) {
                            if (systemKey === 'WTA') {
                                const playerWtaRank = rankingPositions.WTA || 9999;
                                if (playerWtaRank > req) rankLocked = true;
                            } else if (systemKey === 'ITF') {
                                const sysPoints = playerRanking[systemKey] || 0;
                                if (sysPoints < req) rankLocked = true;
                            }
                        }
                        event.system_tag = systemKey;
                        event.is_rank_locked = rankLocked;
                        if (systemKey === 'ITF_Junior') {
                            event.entry_points = _ITF_JUNIOR_ENTRY_POINTS[event.level_code] || 0;
                        }
                        matches.push(event);
                    }
                }
            }
        }
    }
    return matches;
}

/**
 * 根据ID在全量数据中查找单一赛事
 * @param {object} allData
 * @param {string|number} tId
 * @returns {object|null}
 */
export function findEventById(allData, tId) {
    for (const system of Object.values(allData)) {
        for (const levelEvents of Object.values(system)) {
            if (Array.isArray(levelEvents)) {
                for (const event of levelEvents) {
                    if (event.id === tId) {
                        return event;
                    }
                }
            }
        }
    }
    return null;
}

/**
 * 一键获取已加载数据中某月的所有比赛
 * @param {object} allData
 * @param {number} month
 * @returns {object[]}
 */
export function getMonthlyMatches(allData, month) {
    const results = [];
    for (const system of Object.values(allData)) {
        for (const levelEvents of Object.values(system)) {
            if (Array.isArray(levelEvents)) {
                for (const event of levelEvents) {
                    if (event.month === month) {
                        results.push(event);
                    }
                }
            }
        }
    }
    return results;
}
