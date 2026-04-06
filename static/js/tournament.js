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
export function getEventsForPlayer(allData, age, month, playerRanking) {
    let allowedSystems;
    if (age < 14) {
        allowedSystems = ["CTJ"];
    } else {
        allowedSystems = ["ITF_Junior", "ITF", "WTA"];
    }

    if (!playerRanking) {
        playerRanking = {};
    }

    const matches = [];
    for (const systemKey of allowedSystems) {
        const targetSystem = allData[systemKey] || {};
        // ITF 女子职业赛用 ITF 积分，WTA 赛用 WTA 积分作为准入依据
        const sysPoints = playerRanking[systemKey] || 0;

        for (const levelEvents of Object.values(targetSystem)) {
            if (Array.isArray(levelEvents)) {
                for (const event of levelEvents) {
                    if (typeof event === 'object' && event !== null && event.month === month) {
                        // 按各体系积分校验准入门槛
                        const req = event.req_ranking || 0;
                        if ((systemKey === 'ITF' || systemKey === 'WTA') && sysPoints < req) {
                            continue; // 积分不足，不展示该赛事
                        }
                        event.system_tag = systemKey;
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
