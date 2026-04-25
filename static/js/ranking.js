import { NAME_POOL } from './news.js';

const JUNIOR_NAMES = [
    "Sofia Andresyan", "Mia Kowalczyk", "Zoe Hartmann", "Emma Lindqvist",
    "Isabela Carvalho", "Yuki Tanaka", "Liu Yibing", "Park Sujin",
    "Anna Petrova", "Lena Müller", "Clara Dubois", "Rita Fernández",
    "Valeria Greco", "Hana Novak", "Ester Johansson", "Lily Chen",
    "Priya Sharma", "Amara Diallo", "Kate Wilson", "Nadia Hassan",
    "Elif Yilmaz", "Oksana Bondarenko", "Ingrid Larsen", "Fiona MacLeod",
    "Maya Rostova", "Sun Ruiqi", "Lee Dayoung", "Chiara Bianchi",
    "Sandra Osei", "Valentina Ruiz", "Miriam Khoury", "Jana Blazevic",
    "Fatou Diop", "Anika Schreiber", "Lin Xiaotong", "Kim Hyunji",
    "Vera Koroleva", "Alba Martínez", "Nour Al-Rashidi", "Tara Murphy",
    "Dina Volkov", "Leila Ahmadi", "Sara Kovacs", "Momo Fujita",
    "Xia Yuhan", "Natalie Brandt", "Olena Sydorenko", "Carmen Herrera",
    "Lara Vogt", "Jade Laurent", "Anya Sidorov", "Zheng Weixi",
    "Min-Ji Yoon", "Rosa Esposito", "Maria Toth", "Nina Schulz",
    "Layla Mansouri", "Grace O'Brien", "Yuna Kim", "Bianca Popescu",
];

export class RankingManager {
    constructor() {
        this.surnames = ["林", "沈", "苏", "乔", "裴", "陆", "贺", "江", "时", "孟", "盛", "简", "叶", "白", "顾", "秦"];
        this.given_names = ["漫", "若冰", "嘉仪", "一曼", "婉", "之柔", "星遥", "予宁", "羽", "晚晚", "清秋", "安",
            "悦", "舒", "然", "微"];
    }

    /**
     * 核心逻辑：自动执行"12个月滚动过滤"与"择优录取"
     * @param {object} rankingData - 积分存档对象，直接修改
     * @param {number} currentYear
     * @param {number} currentMonth
     * @param {number} age
     * @returns {number} total effective points
     */
    refreshRanking(rankingData, currentYear, currentMonth, age) {
        // CTJ 报名窗口为 12–14 岁；15 岁起切到 Junior 滚动维护
        const systemKey = age < 15 ? "CTJ" : "ITF_Junior";
        const limit = 8;

        if (!rankingData[systemKey]) {
            rankingData[systemKey] = { summary: {}, point_history: [] };
        }

        const history = rankingData[systemKey].point_history;
        const currentTimeVal = currentYear * 12 + currentMonth;

        const activePool = [];
        for (const p of history) {
            const pTimeVal = p.year * 12 + p.month;
            if ((currentTimeVal - pTimeVal) < 12) {
                p.is_expired = false;
                activePool.push(p);
            }
            // 过期记录直接丢弃，不再保留到 history
        }

        rankingData[systemKey].point_history = activePool;
        activePool.sort((a, b) => b.points - a.points);

        let totalEffective = 0;
        for (let i = 0; i < activePool.length; i++) {
            if (i < limit) {
                activePool[i].is_effective = true;
                totalEffective += activePool[i].points;
            } else {
                activePool[i].is_effective = false;
            }
        }

        rankingData[systemKey].summary = {
            total_effective_points: totalEffective,
            ranking_system: `Best-of-${limit}`,
            last_updated: `${currentYear}-${String(currentMonth).padStart(2, '0')}`
        };

        return totalEffective;
    }

    /**
     * 返回所有体系的当前有效积分，用于报名资格校验
     * @param {object} rankingData
     * @returns {object} { CTJ: number, ITF_Junior: number, ITF: number, WTA: number }
     */
    getAllRankings(rankingData) {
        const result = {};
        for (const systemKey of ["CTJ", "ITF_Junior", "ITF", "WTA"]) {
            if (rankingData[systemKey]) {
                result[systemKey] = (rankingData[systemKey].summary || {}).total_effective_points || 0;
            } else {
                result[systemKey] = 0;
            }
        }
        return result;
    }

    /**
     * 生成 100 名 NPC + 20 名 WTA 球员的动态排名
     * @returns {object} { competitors: [...], wta: [...] }
     */
    generateDynamicRankings() {
        const competitors = [];

        const fullNames = new Set();
        while (fullNames.size < 100) {
            const name = this.surnames[Math.floor(Math.random() * this.surnames.length)] +
                this.given_names[Math.floor(Math.random() * this.given_names.length)];
            fullNames.add(name);
        }
        const nameList = Array.from(fullNames);

        // CTJ 基准积分：头部约 4000，尾部接近 0
        const CTJ_BASE = [
            4000, 3500, 3100, 2800, 2550, 2350, 2180, 2030, 1900, 1780,  // 1~10
            1690, 1610, 1540, 1480, 1420, 1370, 1320, 1270, 1220, 1170,  // 11~20
            1120, 1080, 1040, 1000,  960,  925,  890,  855,  825,  795,  // 21~30
             765,  735,  705,  675,  645,  615,  585,  555,  530,  505,  // 31~40
             480,  455,  430,  405,  380,  360,  340,  320,  300,  280,  // 41~50
             260,  245,  230,  215,  200,  185,  170,  158,  146,  134,  // 51~60
             122,  112,  102,   93,   85,   77,   70,   64,   58,   52,  // 61~70
              47,   42,   38,   34,   30,   27,   24,   21,   19,   17,  // 71~80
              15,   13,   11,   10,    9,    8,    7,    6,    5,    4,  // 81~90
               4,    3,    3,    2,    2,    2,    1,    1,    1,    1,  // 91~100
        ];
        for (let i = 0; i < 100; i++) {
            const base = CTJ_BASE[i];
            // 头部噪声大（±4%），中段 ±3%，尾部 ±2 分
            const ratio = i < 10 ? 0.04 : (i < 50 ? 0.03 : 0.02);
            const span = Math.max(2, Math.floor(base * ratio));
            const noise = Math.floor(Math.random() * (span * 2 + 1)) - span;
            competitors.push({
                rank: i + 1,
                name: nameList[i],
                points: Math.max(0, base + noise)
            });
        }
        competitors.sort((a, b) => b.points - a.points);
        for (let i = 0; i < competitors.length; i++) competitors[i].rank = i + 1;

        // WTA 排名 — 30 人，从 NAME_POOL 取名
        // 基准积分：模拟真实 WTA 分布（头部陡降，中段缓降）
        const WTA_BASE = [
            10000, 8000, 7500, 6500, 6000, 5500, 4500,  // 1~7
            4000, 3400, 3300,                             // 8~10
            3000, 2800, 2600, 2500, 2400,                 // 11~15
            2280, 2200, 2160, 2010, 1960,                 // 16~20
            1810, 1760, 1680, 1630, 1560,                 // 21~25
            1500, 1480, 1450, 1430, 1400,                 // 26~30
        ];
        const shuffledNames = [...NAME_POOL].sort(() => Math.random() - 0.5);
        const wtaRankings = [];
        for (let i = 0; i < shuffledNames.length; i++) {
            const base = WTA_BASE[i] ?? 800;
            // 头部浮动大（±3%），20名以后浮动收窄（±1%，约十几分）
            const ratio = i < 20 ? 0.03 : 0.01;
            const noise = Math.floor(Math.random() * (base * ratio * 2)) - Math.floor(base * ratio);
            wtaRankings.push({
                rank: i + 1,
                name: shuffledNames[i].full,
                points: Math.max(500, base + noise)
            });
        }

        // ITF Junior 排名 — 60 人，国际青少年球员
        const ITF_JR_BASE = [
            2800, 2600, 2400, 2250, 2150, 2050, 1980, 1920, 1860, 1800, // 1~10
            1750, 1700, 1660, 1620, 1580, 1540, 1500, 1460, 1430, 1400, // 11~20
            1370, 1340, 1310, 1280, 1250, 1220, 1190, 1160, 1130, 1100, // 21~30
            1060, 1020,  980,  940,  900,  860,  820,  780,  740,  700, // 31~40
             660,  620,  580,  540,  500,  460,  420,  380,  340,  300, // 41~50
             270,  240,  215,  190,  165,  145,  125,  105,   85,   65, // 51~60
        ];
        const shuffledJrNames = [...JUNIOR_NAMES].sort(() => Math.random() - 0.5);
        const itfJuniorRankings = [];
        for (let i = 0; i < shuffledJrNames.length; i++) {
            const base = ITF_JR_BASE[i] ?? 60;
            const noise = Math.floor(Math.random() * 41) - 20;
            itfJuniorRankings.push({
                rank: i + 1,
                name: shuffledJrNames[i],
                points: Math.max(0, base + noise)
            });
        }

        return { competitors, wta: wtaRankings, itf_junior: itfJuniorRankings };
    }

    /**
     * 模拟游戏过程中 NPC 的积分变动
     * @param {object} worldData - { competitors: [...], wta: [...] }，直接修改
     * @param {number} currentYear
     * @param {number} currentMonth
     */
    updateWorldNpcs(worldData, currentYear, currentMonth) {
        if (!worldData) return;

        // 模拟竞争对手 (Competitors) 的变动 — 各档涨跌概率配平，每月期望均值 ≈ 0
        for (const npc of worldData.competitors) {
            const tier = npc.points >= 1800 ? 'top'
                : npc.points >= 600 ? 'mid'
                : npc.points >= 100 ? 'low'
                : 'tail';
            let change = 0;
            const roll = Math.random();
            if (tier === 'top') {
                if (roll < 0.35)      change = 80 + Math.floor(Math.random() * 220);
                else if (roll < 0.75) change = -(80 + Math.floor(Math.random() * 200));
                else                  change = Math.floor(Math.random() * 61) - 30;
            } else if (tier === 'mid') {
                if (roll < 0.30)      change = 50 + Math.floor(Math.random() * 150);
                else if (roll < 0.65) change = -(50 + Math.floor(Math.random() * 130));
                else                  change = Math.floor(Math.random() * 41) - 20;
            } else if (tier === 'low') {
                if (roll < 0.35)      change = 20 + Math.floor(Math.random() * 60);
                else if (roll < 0.70) change = -(20 + Math.floor(Math.random() * 50));
                else                  change = Math.floor(Math.random() * 17) - 8;
            } else {
                if (roll < 0.45)      change = 3 + Math.floor(Math.random() * 12);
                else if (roll < 0.85) change = -(2 + Math.floor(Math.random() * 8));
                else                  change = 0;
            }
            npc.points = Math.max(0, npc.points + change);
        }

        // 模拟 WTA 30 人月度积分变动 — 真实滚动期净变化，配对涨跌守恒
        // 含义：每名 NPC 都同时有"新成绩入账"和"去年同期赛事过期出账"，事件池给出的是净差。
        const _flux = (mag) => mag + Math.floor(Math.random() * Math.max(1, Math.floor(mag * 0.3)));
        const _shuffleArr = (xs) => {
            for (let i = xs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [xs[i], xs[j]] = [xs[j], xs[i]];
            }
            return xs;
        };

        // 先排序定位 top 8
        worldData.wta.sort((a, b) => b.points - a.points);

        // Top 8 专属：1 对 ±700~1100 的强波动（GS 冠军入账 / 旧 GS 集中过期）
        const top8Pair = _shuffleArr([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 2);
        const bigMag = 700 + Math.floor(Math.random() * 401);
        worldData.wta[top8Pair[0]].points += bigMag;
        worldData.wta[top8Pair[1]].points = Math.max(500, worldData.wta[top8Pair[1]].points - bigMag);

        // 其余 22 人：常规配对池，单人封顶 ±520 左右
        const otherWtaEvents = [
            +_flux(400), -_flux(400),  // 状态起伏 ×1 对
            +_flux(220), -_flux(220),  // 上升 / 下滑 ×2 对
            +_flux(220), -_flux(220),
            +_flux(120), -_flux(120),  // 微幅 ×4 对
            +_flux(120), -_flux(120),
            +_flux(120), -_flux(120),
            +_flux(120), -_flux(120),
        ];
        const otherIdx = [];
        for (let i = 0; i < worldData.wta.length; i++) {
            if (!top8Pair.includes(i)) otherIdx.push(i);
        }
        const otherFillerCount = otherIdx.length - otherWtaEvents.length;
        for (let i = 0; i < Math.floor(otherFillerCount / 2); i++) {
            const v = 20 + Math.floor(Math.random() * 41);
            otherWtaEvents.push(+v, -v);
        }
        while (otherWtaEvents.length < otherIdx.length) otherWtaEvents.push(0);

        otherWtaEvents.sort(() => Math.random() - 0.5);
        for (let k = 0; k < otherIdx.length; k++) {
            const i = otherIdx[k];
            worldData.wta[i].points = Math.max(500, worldData.wta[i].points + otherWtaEvents[k]);
        }

        // 模拟 ITF Junior 60 人积分变动 — 同款配对涨跌，单人单月封顶 ±200
        if (worldData.itf_junior && worldData.itf_junior.length > 0) {
            const jrPool = [
                +_flux(150), -_flux(150),
                +_flux(80),  -_flux(80),
                +_flux(80),  -_flux(80),
                +_flux(40),  -_flux(40),
                +_flux(40),  -_flux(40),
            ];
            const jrFillerCount = worldData.itf_junior.length - jrPool.length;
            for (let i = 0; i < Math.floor(jrFillerCount / 2); i++) {
                const v = 5 + Math.floor(Math.random() * 16);
                jrPool.push(+v, -v);
            }
            while (jrPool.length < worldData.itf_junior.length) jrPool.push(0);
            jrPool.sort(() => Math.random() - 0.5);
            for (let i = 0; i < worldData.itf_junior.length; i++) {
                worldData.itf_junior[i].points = Math.max(0, worldData.itf_junior[i].points + jrPool[i]);
            }
            worldData.itf_junior.sort((a, b) => b.points - a.points);
            for (let i = 0; i < worldData.itf_junior.length; i++) {
                worldData.itf_junior[i].rank = i + 1;
            }
        }

        // 名次轮换：相邻名次小幅积分对调（彼此差距不大，对调≈名次互换），不引入额外分数

        // 重新排序
        worldData.competitors.sort((a, b) => b.points - a.points);
        for (let i = 0; i < worldData.competitors.length; i++) {
            worldData.competitors[i].rank = i + 1;
        }
        worldData.wta.sort((a, b) => b.points - a.points);
        for (let i = 0; i < worldData.wta.length; i++) {
            worldData.wta[i].rank = i + 1;
        }
        if (worldData.itf_junior) {
            worldData.itf_junior.sort((a, b) => b.points - a.points);
            for (let i = 0; i < worldData.itf_junior.length; i++) {
                worldData.itf_junior[i].rank = i + 1;
            }
        }
    }
}

/**
 * 根据成人累计积分估算世界排名位次。
 * 积分 >= 最低 NPC WTA 积分时直接与 NPC 列表比较；否则用区间插值表。
 * @param {number} totalPts  - ITF + WTA 累计有效积分之和
 * @param {object[]} wtaNpcs - worldData.wta 数组
 * @returns {number|null} 估算排名位次，0积分返回 null
 */
export function computeProfessionalRank(totalPts, wtaNpcs) {
    if (!totalPts || totalPts <= 0) return null;

    if (wtaNpcs && wtaNpcs.length > 0) {
        const sorted = [...wtaNpcs].sort((a, b) => b.points - a.points);
        const minNpcPts = sorted[sorted.length - 1].points;
        if (totalPts >= minNpcPts) {
            return sorted.filter(n => n.points > totalPts).length + 1;
        }
    }

    // 区间插值：积分 → 排名位次（高积分→低位次数字→更好名次）
    const brackets = [
        { minPts: 1200, maxPts: 1400, worstRank: 45,   bestRank: 30  },
        { minPts: 1000, maxPts: 1200, worstRank: 60,   bestRank: 45  },
        { minPts:  900, maxPts: 1000, worstRank: 80,   bestRank: 60  },
        { minPts:  800, maxPts:  900, worstRank: 100,  bestRank: 80  },
        { minPts:  600, maxPts:  800, worstRank: 130,  bestRank: 100 },
        { minPts:  450, maxPts:  600, worstRank: 150,  bestRank: 130 },
        { minPts:  350, maxPts:  450, worstRank: 200,  bestRank: 150 },
        { minPts:  200, maxPts:  350, worstRank: 300,  bestRank: 200 },
        { minPts:  100, maxPts:  200, worstRank: 500,  bestRank: 300 },
        { minPts:   50, maxPts:  100, worstRank: 800,  bestRank: 500 },
        { minPts:   20, maxPts:   50, worstRank: 1500, bestRank: 800 },
        { minPts:    1, maxPts:   20, worstRank: 1500, bestRank: 1500 },
    ];

    for (const b of brackets) {
        if (totalPts >= b.minPts) {
            if (b.worstRank === b.bestRank) return b.worstRank;
            const t = Math.min(1, (totalPts - b.minPts) / (b.maxPts - b.minPts));
            return Math.round(b.worstRank - t * (b.worstRank - b.bestRank));
        }
    }
    return 1500;
}
