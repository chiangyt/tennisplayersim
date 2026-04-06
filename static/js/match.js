// 14岁后对手类型系统
const _OPP_TYPES = ['power', 'technique', 'agility'];
const _TYPE_ZH = { power: '力量型', technique: '技术型', agility: '敏捷型' };
// power 克制 technique，technique 克制 agility，agility 克制 power
const _BEATS = { power: 'technique', technique: 'agility', agility: 'power' };

// Random helpers
function _randUniform(a, b) {
    return a + Math.random() * (b - a);
}

function _randInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

function _randChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 从 playstyle 字符串判断打法类型
 */
function _getPlayerType(playstyle) {
    if (!playstyle) return null;
    if (playstyle === "底线力量型") return 'power';
    if (playstyle === "灵巧战术型") return 'technique';
    if (playstyle === "跑动防守型") return 'agility';
    return null;
}

/**
 * 返回 [克制系数, 描述文本]
 */
function _matchupFactor(playerType, oppType) {
    if (!playerType) return [1.0, ''];
    if (_BEATS[playerType] === oppType) {
        return [1.1, `⚔️ 克制${_TYPE_ZH[oppType]}对手`];
    } else if (_BEATS[oppType] === playerType) {
        return [0.9, `🛡️ 被${_TYPE_ZH[oppType]}对手压制`];
    }
    return [1.0, `对阵${_TYPE_ZH[oppType]}对手`];
}

/**
 * 将比赛增益分配到属性，14岁前加综合素质，14岁后随机分配到三项专项。
 * 返回描述增益的字符串。
 */
function _applyStatGain(player, gain) {
    if (player.age >= 14 && player.power !== null) {
        const weights = [Math.random(), Math.random(), Math.random()];
        const totalW = weights[0] + weights[1] + weights[2];
        const pG = gain * weights[0] / totalW;
        const tG = gain * weights[1] / totalW;
        const aG = gain - pG - tG;
        player.power = Math.min(100, player.power + pG);
        player.technique = Math.min(100, player.technique + tG);
        player.agility = Math.min(100, player.agility + aG);
        player.general_stats = player.power + player.technique + player.agility;
        player.perseverance = Math.min(100, player.perseverance + gain * 0.3);
        return `力量+${pG.toFixed(2)} 技术+${tG.toFixed(2)} 敏捷+${aG.toFixed(2)} 毅力+${(gain * 0.3).toFixed(2)}`;
    } else {
        player.general_stats = Math.min(100, player.general_stats + gain);
        player.perseverance = Math.min(100, player.perseverance + gain * 0.2);
        return `综合素质+${gain.toFixed(2)} 毅力+${(gain * 0.2).toFixed(2)}`;
    }
}

/**
 * 根据赛事级别代码确定所属积分体系
 */
function _getSystemFromLevelCode(levelCode) {
    if (!levelCode) return "ITF_Junior";
    const lc = levelCode.toUpperCase();
    if (lc.startsWith('W') && !lc.startsWith('WTA')) {
        return "ITF";       // W15/W25/W60/W100 → ITF 女子职业体系
    }
    if (lc.startsWith('WTA') || lc === 'GS') {
        return "WTA";       // WTA250/WTA500/WTA1000/GS → WTA 体系
    }
    if (lc.startsWith('J')) {
        return "ITF_Junior";
    }
    return "CTJ";
}

/**
 * 更新玩家积分数据（在 rankingData 对象上直接修改，无文件 I/O）
 * @param {object} player
 * @param {object} eventInfo
 * @param {string} reachedRound
 * @param {number} points
 * @param {object} rankingData - 积分存档对象，直接修改
 * @returns {number} total effective points
 */
function _autoUpdatePlayerPoints(player, eventInfo, reachedRound, points, rankingData) {
    const levelCode = eventInfo.level_code || '';
    let systemKey;
    if (player.age < 14) {
        systemKey = "CTJ";
    } else {
        systemKey = _getSystemFromLevelCode(levelCode);
    }
    const limitMap = { CTJ: 8, ITF_Junior: 6, ITF: 6, WTA: 6 };
    const limit = limitMap[systemKey] || 6;

    // 确保体系键存在
    if (!rankingData[systemKey]) {
        rankingData[systemKey] = { summary: {}, point_history: [] };
    }

    // 记录本次比赛成绩
    const newRecord = {
        desc: `${eventInfo.name} (${reachedRound})`,
        year: player.year,
        month: player.month,
        points: points,
        system: systemKey,
        is_effective: false,
        is_expired: false
    };
    rankingData[systemKey].point_history.push(newRecord);

    // 12个月滚动过滤逻辑
    const currentTimeVal = player.year * 12 + player.month;
    const activePool = [];

    for (const p of rankingData[systemKey].point_history) {
        const pTimeVal = p.year * 12 + p.month;
        if ((currentTimeVal - pTimeVal) < 12) {
            p.is_expired = false;
            activePool.push(p);
        } else {
            p.is_expired = true;
            p.is_effective = false;
        }
    }

    // 择优录取 (Best-of-N)
    activePool.sort((a, b) => b.points - a.points);
    let totalEffective = 0;
    for (let i = 0; i < activePool.length; i++) {
        if (i < limit && activePool[i].points > 0) {
            activePool[i].is_effective = true;
            totalEffective += activePool[i].points;
        } else {
            activePool[i].is_effective = false;
        }
    }

    // 更新 Summary
    rankingData[systemKey].summary = {
        total_effective_points: totalEffective,
        ranking_system: `Best-of-${limit}`,
        last_updated: `${player.year}-${String(player.month).padStart(2, '0')}`
    };

    return totalEffective;
}

/**
 * 模拟普通赛事比赛（32签，5轮制）
 * @param {object} player
 * @param {object} matchInfo
 * @param {object} allTournaments
 * @param {object} rankingData - 积分存档对象，直接修改
 * @returns {[string, number, string[], number]} [reachedRoundName, currentPoints, matchLogs, statGain]
 */
export function simulateMatch(player, matchInfo, allTournaments, rankingData) {
    const baseReq = matchInfo.req_stats;
    let oppWisMin, oppWisMax, oppPerMin, oppPerMax;

    if (baseReq < 40) {
        oppWisMin = 5; oppWisMax = 10;
        oppPerMin = 0; oppPerMax = 5;
    } else if (baseReq < 70) {
        oppWisMin = 10; oppWisMax = 20;
        oppPerMin = 5; oppPerMax = 10;
    } else {
        oppWisMin = 20; oppWisMax = 30;
        oppPerMin = 10; oppPerMax = 15;
    }

    const playerPower = (player.general_stats * 0.5 + player.wisdom * 0.4 + player.perseverance * 0.1) * _randUniform(0.95, 1.05);
    const rounds = ["R32", "R16", "1/4决赛", "半决赛", "决赛", "冠军"];
    let currentRound = 0;
    let statGain = 0.0;
    const matchLogs = [];

    // 14岁后启用打法克制体系
    const isAdvanced = player.age >= 14 && player.power !== null;
    const playerType = isAdvanced ? _getPlayerType(player.playstyle) : null;

    // 比赛循环
    for (let i = 0; i < 5; i++) {
        const difficultyFactor = 1 + i * 0.06;
        const oppStat = baseReq * difficultyFactor;
        const oppWisdom = _randInt(oppWisMin, oppWisMax) * difficultyFactor;
        const oppPerseverance = _randInt(oppPerMin, oppPerMax) * difficultyFactor;
        const oppPower = (oppStat * 0.5 + oppWisdom * 0.4 + oppPerseverance * 0.1) * _randUniform(0.95, 1.05);

        let effectivePlayerPower;
        let matchupDesc;

        if (isAdvanced) {
            const oppType = _randChoice(_OPP_TYPES);
            const [factor, desc] = _matchupFactor(playerType, oppType);
            effectivePlayerPower = playerPower * factor;
            matchupDesc = desc;
        } else {
            effectivePlayerPower = playerPower;
            matchupDesc = '';
        }

        const diff = effectivePlayerPower - oppPower;
        let win;
        if (diff > 5) {
            win = true;
        } else if (Math.abs(diff) < 5) {
            win = Math.random() < 0.5;
        } else {
            win = Math.random() < 0.15;
        }

        if (win) {
            currentRound += 1;
            const gain = _randUniform(0.1, 0.25);
            statGain += gain;
            const gainDesc = _applyStatGain(player, gain);
            const matchupPart = matchupDesc ? ` ${matchupDesc}` : "";
            matchLogs.push(`✅ 第 ${i + 1} 轮：顺利晋级至 ${rounds[currentRound]}！${matchupPart}（📈 ${gainDesc}）`);
        } else {
            const matchupPart = matchupDesc ? ` ${matchupDesc}` : "";
            matchLogs.push(`❌ 第 ${i + 1} 轮：在 ${rounds[i]} 遭遇强敌遗憾落败。${matchupPart}`);
            break;
        }
    }

    if (currentRound === 5) {
        const bonus = 0.5;
        statGain += bonus;
        const bonusDesc = _applyStatGain(player, bonus);
        matchLogs.push(`🏆 恭喜！你赢得了本站赛事的冠军！（🎁 夺冠奖励：${bonusDesc}）`);
    }

    // 获取积分
    const currentPoints = matchInfo.points_table[currentRound];
    const reachedRoundName = rounds[currentRound];

    // 自动更新积分
    _autoUpdatePlayerPoints(player, matchInfo, reachedRoundName, currentPoints, rankingData);

    return [reachedRoundName, currentPoints, matchLogs, statGain];
}

/**
 * 大满贯赛事专属模拟（128签，6轮制）
 * @param {object} player
 * @param {object} matchInfo
 * @param {object} allTournaments
 * @param {object} rankingData - 积分存档对象，直接修改
 * @returns {[string, number, string[], number]}
 */
export function simulateGsMatch(player, matchInfo, allTournaments, rankingData) {
    const baseReq = matchInfo.req_stats;

    // 大满贯对手均为顶尖职业球员
    const oppWisMin = 30, oppWisMax = 45;
    const oppPerMin = 20, oppPerMax = 30;

    const playerPower = (
        player.general_stats * 0.5 +
        player.wisdom * 0.4 +
        player.perseverance * 0.1
    ) * _randUniform(0.95, 1.05);

    // 7个节点：currentRound=0 代表在 R64 出局，6 代表夺冠
    const rounds = ["R64", "R32", "R16", "1/4决赛", "半决赛", "决赛", "冠军"];
    let currentRound = 0;
    let statGain = 0.0;
    const matchLogs = [];

    const isAdvanced = player.age >= 14 && player.power !== null;
    const playerType = isAdvanced ? _getPlayerType(player.playstyle) : null;

    for (let i = 0; i < 6; i++) {
        const difficultyFactor = 1 + i * 0.08;
        const oppStat = baseReq * difficultyFactor;
        const oppWisdom = _randInt(oppWisMin, oppWisMax) * difficultyFactor;
        const oppPerseverance = _randInt(oppPerMin, oppPerMax) * difficultyFactor;
        const oppPower = (
            oppStat * 0.5 + oppWisdom * 0.4 + oppPerseverance * 0.1
        ) * _randUniform(0.95, 1.05);

        let effectivePlayerPower;
        let matchupDesc;

        if (isAdvanced) {
            const oppType = _randChoice(_OPP_TYPES);
            const [factor, desc] = _matchupFactor(playerType, oppType);
            effectivePlayerPower = playerPower * factor;
            matchupDesc = desc;
        } else {
            effectivePlayerPower = playerPower;
            matchupDesc = '';
        }

        const diff = effectivePlayerPower - oppPower;
        let win;
        if (diff > 5) {
            win = true;
        } else if (Math.abs(diff) < 5) {
            win = Math.random() < 0.5;
        } else {
            win = Math.random() < 0.15;
        }

        if (win) {
            currentRound += 1;
            const gain = _randUniform(0.2, 0.4);
            statGain += gain;
            const gainDesc = _applyStatGain(player, gain);
            const matchupPart = matchupDesc ? ` ${matchupDesc}` : "";
            matchLogs.push(
                `✅ 第 ${i + 1} 轮：晋级至 ${rounds[currentRound]}！${matchupPart}（📈 ${gainDesc}）`
            );
        } else {
            const matchupPart = matchupDesc ? ` ${matchupDesc}` : "";
            matchLogs.push(
                `❌ 第 ${i + 1} 轮：在 ${rounds[i]} 遭遇顶尖强敌遗憾落败。${matchupPart}`
            );
            break;
        }
    }

    if (currentRound === 6) {
        const bonus = 1.5;
        statGain += bonus;
        const bonusDesc = _applyStatGain(player, bonus);
        matchLogs.push(
            `🏆🏆🏆 恭喜！你赢得了大满贯冠军！这是网球运动的最高荣耀！（🎁 夺冠奖励：${bonusDesc}）`
        );
    }

    const currentPoints = matchInfo.points_table[currentRound];
    const reachedRoundName = rounds[currentRound];

    _autoUpdatePlayerPoints(player, matchInfo, reachedRoundName, currentPoints, rankingData);

    return [reachedRoundName, currentPoints, matchLogs, statGain];
}
