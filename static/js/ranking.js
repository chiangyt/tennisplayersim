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
        const systemKey = age < 14 ? "CTJ" : "ITF_Junior";
        const limit = age < 14 ? 8 : 6;

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
        let currentPts = 2800;

        const fullNames = new Set();
        while (fullNames.size < 100) {
            const name = this.surnames[Math.floor(Math.random() * this.surnames.length)] +
                this.given_names[Math.floor(Math.random() * this.given_names.length)];
            fullNames.add(name);
        }
        const nameList = Array.from(fullNames);

        for (let i = 1; i <= 100; i++) {
            const drop = Math.floor(Math.random() * 16) + 15; // randint(15, 30)
            currentPts -= drop;

            competitors.push({
                rank: i,
                name: nameList[i - 1],
                points: Math.max(0, currentPts)
            });
        }

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
            1200, 1100, 1000, 950, 900, 850, 800, 750, 720, 700, // 1~10
            680,  660,  640,  620, 600, 580, 560, 540, 520, 500, // 11~20
            480,  460,  440,  420, 400, 385, 370, 355, 340, 325, // 21~30
            310,  300,  290,  280, 270, 260, 250, 240, 230, 220, // 31~40
            210,  200,  190,  180, 170, 160, 150, 140, 130, 120, // 41~50
            110,  105,  100,   95,  90,  85,  80,  75,  70,  65, // 51~60
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

        // 模拟竞争对手 (Competitors) 的变动
        for (const npc of worldData.competitors) {
            const choices = [
                Math.floor(Math.random() * 61) + 20,    // 获得好成绩: randint(20, 80)
                -(Math.floor(Math.random() * 21) + 10),  // 积分过期掉分: randint(-30, -10)
                0                                         // 没参赛
            ];
            const change = choices[Math.floor(Math.random() * choices.length)];
            npc.points = Math.max(0, npc.points + change);
        }

        // 模拟 WTA 30 人的积分变动（名额池分配，保证事件互斥）
        // 本月名额池：1个冠军、2个好成绩、5个小涨、4个掉分、其余不变
        const eventPool = [
            1500 + Math.floor(Math.random() * 500),                    // 冠军 ×1
            300 + Math.floor(Math.random() * 500),                     // 好成绩 ×2
            300 + Math.floor(Math.random() * 500),
            30 + Math.floor(Math.random() * 150),                      // 小涨 ×5
            30 + Math.floor(Math.random() * 150),
            30 + Math.floor(Math.random() * 150),
            30 + Math.floor(Math.random() * 150),
            30 + Math.floor(Math.random() * 150),
            -(300 + Math.floor(Math.random() * 1700)),                 // 掉分 ×4
            -(300 + Math.floor(Math.random() * 1700)),
            -(300 + Math.floor(Math.random() * 1700)),
            -(300 + Math.floor(Math.random() * 1700)),
        ];
        // 其余球员本月有比赛参与，小幅浮动 ±100
        while (eventPool.length < worldData.wta.length) {
            eventPool.push(Math.floor(Math.random() * 101) - 100);
        }

        // 随机打乱名额池，分配给球员
        eventPool.sort(() => Math.random() - 0.5);
        for (let i = 0; i < worldData.wta.length; i++) {
            worldData.wta[i].points = Math.max(500, worldData.wta[i].points + eventPool[i]);
        }

        // 模拟 ITF Junior 60 人积分变动
        if (worldData.itf_junior && worldData.itf_junior.length > 0) {
            const jrPool = [
                300 + Math.floor(Math.random() * 200),  // 好成绩 ×1
                80 + Math.floor(Math.random() * 80),    // 小涨 ×4
                80 + Math.floor(Math.random() * 80),
                80 + Math.floor(Math.random() * 80),
                80 + Math.floor(Math.random() * 80),
                -(50 + Math.floor(Math.random() * 150)), // 掉分 ×3
                -(50 + Math.floor(Math.random() * 150)),
                -(50 + Math.floor(Math.random() * 150)),
            ];
            while (jrPool.length < worldData.itf_junior.length) {
                jrPool.push(Math.floor(Math.random() * 21) - 10);
            }
            jrPool.sort(() => Math.random() - 0.5);
            for (let i = 0; i < worldData.itf_junior.length; i++) {
                worldData.itf_junior[i].points = Math.max(0, worldData.itf_junior[i].points + jrPool[i]);
            }
            worldData.itf_junior.sort((a, b) => b.points - a.points);
            for (let i = 0; i < worldData.itf_junior.length; i++) {
                worldData.itf_junior[i].rank = i + 1;
            }
        }

        // 重新排序
        worldData.competitors.sort((a, b) => b.points - a.points);
        for (let i = 0; i < worldData.competitors.length; i++) {
            worldData.competitors[i].rank = i + 1;
        }
        worldData.wta.sort((a, b) => b.points - a.points);
        for (let i = 0; i < worldData.wta.length; i++) {
            worldData.wta[i].rank = i + 1;
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
