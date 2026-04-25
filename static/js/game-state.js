// GameState manages all game data in localStorage
// Structure: { player: {...}, ranking: {...}, social: {...}, world: {...} }
export class GameState {
    static KEY = 'tennis_current_game';

    // 老存档可能把 W15/W35/W75/W100 的积分写在 ITF 池，新逻辑统一进 WTA。
    // 加载时把 ITF.point_history 并入 WTA，删除 ITF 键。
    static _migrateRanking(ranking) {
        if (!ranking || !ranking.ITF) return ranking;
        const itf = ranking.ITF;
        const itfHistory = (itf && itf.point_history) || [];
        if (itfHistory.length > 0) {
            if (!ranking.WTA) ranking.WTA = { summary: {}, point_history: [] };
            if (!Array.isArray(ranking.WTA.point_history)) ranking.WTA.point_history = [];
            ranking.WTA.point_history.push(...itfHistory);
        }
        delete ranking.ITF;
        return ranking;
    }

    static get current() {
        const raw = localStorage.getItem(this.KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data && data.ranking) this._migrateRanking(data.ranking);
        return data;
    }

    static set current(data) {
        if (data) {
            localStorage.setItem(this.KEY, JSON.stringify(data));
        } else {
            localStorage.removeItem(this.KEY);
        }
    }

    static persist() {
        // Re-save current state (call after mutations)
        const data = this.current;
        if (data) localStorage.setItem(this.KEY, JSON.stringify(data));
    }

    static init(playerData, rankingData, socialData, worldData) {
        this.current = {
            player: playerData,
            ranking: rankingData,
            social: socialData,
            world: worldData,
            readNews: []
        };
    }

    static saveSlot(n) {
        const data = this.current;
        if (!data) return false;
        const save = {
            timestamp: new Date().toLocaleString('zh-CN'),
            display: `${data.player.name} · ${data.player.year}年${data.player.month}月`,
            player: data.player,
            ranking: data.ranking,
            social: data.social,
            world: data.world,
            readNews: data.readNews || []
        };
        localStorage.setItem(`tennis_save_${n}`, JSON.stringify(save));
        return true;
    }

    static loadSlot(n) {
        const raw = localStorage.getItem(`tennis_save_${n}`);
        if (!raw) return false;
        const save = JSON.parse(raw);
        this.current = {
            player: save.player,
            ranking: save.ranking,
            social: save.social,
            world: save.world,
            readNews: save.readNews || []
        };
        return true;
    }

    static getSlotInfo(n) {
        const raw = localStorage.getItem(`tennis_save_${n}`);
        if (!raw) return { slot: n, empty: true };
        const save = JSON.parse(raw);
        return {
            slot: n,
            empty: false,
            display: save.display || '',
            timestamp: save.timestamp || ''
        };
    }

    static deleteSlot(n) {
        localStorage.removeItem(`tennis_save_${n}`);
    }

    static exportSave() {
        const data = this.current;
        if (!data) return null;
        return JSON.stringify(data, null, 2);
    }

    static importSave(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (data.player) {
                this.current = data;
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    // Helper to update a specific part of the state
    static updatePlayer(playerData) {
        const data = this.current;
        if (data) {
            data.player = playerData;
            this.current = data;
        }
    }

    static updateRanking(rankingData) {
        const data = this.current;
        if (data) {
            data.ranking = rankingData;
            this.current = data;
        }
    }

    static updateSocial(socialData) {
        const data = this.current;
        if (data) {
            data.social = socialData;
            this.current = data;
        }
    }

    static updateWorld(worldData) {
        const data = this.current;
        if (data) {
            data.world = worldData;
            this.current = data;
        }
    }

    static updatePlayerAndSocial(playerData, socialData) {
        const data = this.current;
        if (data) {
            data.player = playerData;
            data.social = socialData;
            this.current = data;
        }
    }

    static get tutorialSeen() {
        return localStorage.getItem('tennis_tutorial_seen') === '1';
    }

    static markTutorialSeen() {
        localStorage.setItem('tennis_tutorial_seen', '1');
    }
}
