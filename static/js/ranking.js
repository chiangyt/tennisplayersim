import { NAME_POOL } from './news.js';

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
        const wtaRankings = [];
        const wtaBase = 9500;
        for (let i = 0; i < NAME_POOL.length; i++) {
            const pts = wtaBase - (i * 250) + (Math.floor(Math.random() * 201) - 100);
            wtaRankings.push({
                rank: i + 1,
                name: NAME_POOL[i].full,
                points: Math.max(2000, pts)
            });
        }

        return { competitors, wta: wtaRankings };
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

        // 模拟 WTA 30 人的积分变动
        for (const star of worldData.wta) {
            star.points += Math.floor(Math.random() * 301) - 150; // randint(-150, 150)
            star.points = Math.max(1500, star.points);
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
