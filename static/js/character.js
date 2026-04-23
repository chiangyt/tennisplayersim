import { simulateMatch, simulateGsMatch } from './match.js';

export class TennisGirl {
    constructor(name, background, playstyle) {
        this.name = name;
        this.background = background;
        this.playstyle = playstyle;

        // 基础状态
        this.year = 2024;
        this.month = 1;
        this.week = 1;
        this.age = 12;
        this.stamina = 100;
        this.mood = 100;
        this.money = 5000;
        this.height = 165.0;

        // 12-14岁核心属性
        this.general_stats = 30.0;
        this.wisdom = 10.0;
        this.perseverance = 10.0;

        // 专项属性：一开始不初始化，14岁再生成
        this.power = null;
        this.technique = null;
        this.agility = null;

        // 根据打法设定增益因子
        this.gain_factors = this._initGainFactors(playstyle);
        this.log = ["12岁的夏天，你的职业球员之路正式开启了。"];
        this.scheduled_tournaments = {};
        this.ctj_first_champion_sent = false;
    }

    _initGainFactors(style) {
        const factors = { power: 1.0, technique: 1.0, agility: 1.0 };
        if (style === "灵巧战术型") {
            factors.technique = 1.3;
        } else if (style === "底线力量型") {
            factors.power = 1.3;
        } else if (style === "跑动防守型") {
            factors.agility = 1.3;
        }
        return factors;
    }

    /**
     * 一键执行月度计划，处理体力、训练、比赛和积分同步
     * @param {string[]} actions
     * @param {object} allTournaments
     * @param {object} rankingData - ranking data object, mutated in-place
     * @param {function} [socialTrigger] - callback(charId, msgId) for CTJ first champion trigger
     */
    executePlan(actions, allTournaments, rankingData, socialTrigger) {
        this.log.push(`📅 --- 执行 ${this.month} 月计划 ---`);

        for (const act of actions) {
            if (act === "play_match") {
                const matchInfo = this.scheduled_tournaments[String(this.month)];
                let reachedRoundName, pEarned, matchLogs, gGain;

                if (matchInfo && matchInfo.level_code === 'GS') {
                    [reachedRoundName, pEarned, matchLogs, gGain] = simulateGsMatch(this, matchInfo, allTournaments, rankingData);
                } else {
                    [reachedRoundName, pEarned, matchLogs, gGain] = simulateMatch(this, matchInfo, allTournaments, rankingData);
                }

                this.just_won_championship = reachedRoundName === "冠军";
                if (reachedRoundName === "冠军") {
                    this.mood += 10;
                    const lc = matchInfo ? (matchInfo.level_code || '') : '';
                    if (!this.ctj_first_champion_sent && ['A', 'B', 'C'].includes(lc.charAt(0))) {
                        if (typeof socialTrigger === 'function') {
                            socialTrigger("mom", "mom_p_champion");
                        }
                        this.ctj_first_champion_sent = true;
                    }
                } else {
                    this.mood -= 10;
                }
                this.log.push(...matchLogs);
            } else if (act.includes("train_")) {
                this.mood -= 5;
                this.log.push(this.train(act.split("_")[1]));
            } else {
                this.mood += 5;
                this.log.push(this.rest());
            }
        }
    }

    canAffordActions(actions) {
        let simStamina = this.stamina;

        for (const a of actions) {
            let cost;
            if (a === "play_match") {
                cost = 50;
            } else if (a.includes("train_")) {
                const sub = a.split("_")[1];
                cost = sub === "wisdom" ? 20 : 25;
            } else if (a === "rest") {
                simStamina = Math.min(100, simStamina + 30);
                continue;
            } else {
                continue;
            }

            if (simStamina < cost) {
                return false;
            }
            simStamina -= cost;
        }
        return true;
    }

    train(subType) {
        const cost = subType === "wisdom" ? 20 : 25;

        if (this.stamina < cost) {
            return `体力不足，${this.name}现在只想躺平。`;
        }

        this.stamina -= cost;

        if (this.age < 14) {
            if (subType === "tennis") {
                if (this.mood < 30) {
                    const gain = 1.0;
                    this.general_stats = Math.min(100, this.general_stats + gain);
                    return `${this.name}心情不好，训练效果大打折扣。`;
                } else {
                    const gain = 1.5;
                    this.general_stats = Math.min(100, this.general_stats + gain);
                    return `${this.name}进行了高强度的基础训练，综合素质提升了。`;
                }
            } else if (subType === "wisdom") {
                if (this.mood < 30) {
                    this.wisdom = Math.min(100, this.wisdom + 0.8);
                    return `${this.name}心情不好，复盘效率不高。`;
                } else {
                    this.wisdom = Math.min(100, this.wisdom + 1.2);
                    return `${this.name}观看了比赛录像，智慧提升了。`;
                }
            }
        } else {
            const gain = 1.2 * (this.gain_factors[subType] || 1.0);
            if (subType === "power") {
                this.power += gain;
            } else if (subType === "technique") {
                this.technique += gain;
            } else if (subType === "agility") {
                this.agility += gain;
            } else if (subType === "wisdom") {
                this.wisdom = Math.min(100, this.wisdom + 1.0);
            }
            this.general_stats = this.power + this.technique + this.agility;
            const subCn = { power: "力量", technique: "技术", agility: "敏捷", wisdom: "智慧" };
            return `针对${subCn[subType] || subType}进行了专项强化，进步飞快。`;
        }
    }

    rest() {
        const recovery = 30;
        this.stamina = Math.min(100, this.stamina + recovery);
        return `这周${this.name}回宿舍补了个大觉，感觉体力充沛了不少。`;
    }

    applyForTournament(eventData) {
        let targetMonth = this.month + 1;
        if (targetMonth > 12) {
            targetMonth = 1;
        }

        this.scheduled_tournaments[String(targetMonth)] = {
            id: eventData.id,
            name: eventData.name,
            level_code: eventData.level_code,
            points_table: eventData.points,
            req_stats: eventData.req_stats
        };

        this.log.push(`📅 报名成功！已预定 ${targetMonth}月 ${eventData.name}。记得在行程中安排 ⚡参加比赛（体力-50），请确保届时体力充足。`);
        return true;
    }

    clearPastTournaments() {
        const lastMonth = this.month > 1 ? this.month - 1 : 12;
        const lastMonthKey = String(lastMonth);
        if (lastMonthKey in this.scheduled_tournaments) {
            delete this.scheduled_tournaments[lastMonthKey];
        }
    }

    updateTimeAndAge() {
        this.month += 1;
        this.clearPastTournaments();
        if (this.month > 12) {
            this.month = 1;
            this.year += 1;
            this.age += 1;
            this.log.push(`🎂 祝${this.name}生日快乐！你今年 ${this.age} 岁了，离职业梦想又近了一步。`);

            // Height growth: random range per age, tapers off after 16
            const growthRanges = {
                13: [3.0, 6.0],
                14: [2.0, 5.0],
                15: [1.0, 4.0],
                16: [0.5, 2.5],
                17: [0.0, 1.5],
                18: [0.0, 0.5],
            };
            const range = growthRanges[this.age];
            if (range) {
                const growth = Math.round((range[0] + Math.random() * (range[1] - range[0])) * 10) / 10;
                if (growth > 0) {
                    const prevHeight = this.height;
                    this.height = Math.round((this.height + growth) * 10) / 10;
                    this.log.push(`📏 ${this.name}又长高了！身高从 ${prevHeight.toFixed(1)} cm 增长到 ${this.height.toFixed(1)} cm。`);
                }
            }

            if (this.age === 14) {
                const baseVal = this.general_stats * 0.2;
                this.power = baseVal;
                this.technique = baseVal;
                this.agility = baseVal;
                this.general_stats = this.power + this.technique + this.agility;
                this.log.push(`🎉 14岁生日！${this.name}已解锁专项属性，综合素质重置为三项之和。`);
            }
            return true;
        }
        return false;
    }

    get currentMonthEvent() {
        return this.scheduled_tournaments[String(this.month)] || null;
    }

    get isRegisteredThisMonth() {
        return this.currentMonthEvent !== null;
    }

    toJSON() {
        const excludedKeys = new Set(['gain_factors']);
        const data = {};
        for (const [k, v] of Object.entries(this)) {
            if (!excludedKeys.has(k)) {
                data[k] = v;
            }
        }
        if (data.log) {
            data.log = this.log.slice(-20);
        }
        return data;
    }

    static fromJSON(data) {
        if (!data) return null;
        const p = new TennisGirl(data.name, data.background, data.playstyle);
        Object.assign(p, data);
        // Rebuild gain_factors from playstyle
        p.gain_factors = p._initGainFactors(p.playstyle);
        return p;
    }
}
