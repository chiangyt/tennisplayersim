export class SocialManager {
    constructor() {}

    static _safeStr(value) {
        return value == null ? '' : String(value);
    }

    static _safeInt(value) {
        const n = parseInt(value, 10);
        return isNaN(n) ? 0 : n;
    }

    _normalizeOptions(options) {
        if (!Array.isArray(options)) return [];

        const normalized = [];
        for (const opt of options) {
            if (typeof opt === 'string') {
                normalized.push({ text: SocialManager._safeStr(opt) });
                continue;
            }
            if (typeof opt !== 'object' || opt === null) continue;

            const copied = { ...opt };
            copied.text = SocialManager._safeStr(copied.text || '');
            if ('next_id' in copied) {
                copied.next_id = SocialManager._safeStr(copied.next_id);
            }
            if ('trigger_id' in copied) {
                copied.trigger_id = SocialManager._safeStr(copied.trigger_id);
            }
            if ('next_story' in copied) {
                if (typeof copied.next_story === 'object' && copied.next_story !== null) {
                    copied.next_story = this._normalizeStory(copied.next_story);
                } else if (typeof copied.next_story === 'string') {
                    copied.next_story = SocialManager._safeStr(copied.next_story);
                } else {
                    delete copied.next_story;
                }
            }
            if ('next_options' in copied) {
                copied.next_options = this._normalizeOptions(copied.next_options || []);
            }
            normalized.push(copied);
        }
        return normalized;
    }

    _normalizeStory(story) {
        if (typeof story !== 'object' || story === null) return null;

        const normalized = { ...story };
        if ('id' in normalized) normalized.id = SocialManager._safeStr(normalized.id);
        if ('content' in normalized) normalized.content = SocialManager._safeStr(normalized.content);
        if ('title' in normalized) normalized.title = SocialManager._safeStr(normalized.title);
        if ('player_content' in normalized) normalized.player_content = SocialManager._safeStr(normalized.player_content);
        if ('reply' in normalized) normalized.reply = SocialManager._safeStr(normalized.reply);

        normalized.options = this._normalizeOptions(normalized.options || []);
        return normalized;
    }

    _normalizeData(data) {
        if (typeof data !== 'object' || data === null) return {};

        for (const char of Object.values(data)) {
            if (typeof char !== 'object' || char === null) continue;

            if (!('name' in char)) char.name = '';
            if (!('theme' in char)) char.theme = '';
            if (!('avatar_icon' in char)) char.avatar_icon = '';
            char.name = SocialManager._safeStr(char.name || '');
            char.theme = SocialManager._safeStr(char.theme || '');
            char.avatar_icon = SocialManager._safeStr(char.avatar_icon || '');
            char.unread_count = SocialManager._safeInt(char.unread_count || 0);
            char.last_time = SocialManager._safeStr(char.last_time || '');

            let history = char.history;
            if (!Array.isArray(history)) history = [];
            char.history = history
                .filter(msg => typeof msg === 'object' && msg !== null)
                .map(msg => ({
                    role: msg.role === 'me' ? 'me' : 'other',
                    content: SocialManager._safeStr(msg.content || ''),
                    image_url: SocialManager._safeStr(msg.image_url || ''),
                }));

            char.pending_options = this._normalizeOptions(char.pending_options || []);
            char.msg_pool = (char.msg_pool || [])
                .map(v => this._normalizeStory(v))
                .filter(m => m !== null);
            char.msg_queue = (char.msg_queue || [])
                .map(v => this._normalizeStory(v))
                .filter(m => m !== null);
            char.proactive_pool = (char.proactive_pool || [])
                .map(v => this._normalizeStory(v))
                .filter(m => m !== null);
            char.msg_idle_months = SocialManager._safeInt(char.msg_idle_months || 0);
        }

        return data;
    }

    /**
     * 获取所有聊天数据（归一化后返回）
     * @param {object} socialData
     * @returns {object}
     */
    getAllChats(socialData) {
        return this._normalizeData(socialData);
    }

    /**
     * 获取某个角色的聊天详情，同时清除未读
     * @param {object} socialData
     * @param {string} charId
     * @returns {object|null}
     */
    getChatDetail(socialData, charId) {
        const data = this._normalizeData(socialData);
        const char = data[charId];
        if (char) {
            if (char.unread_count > 0) {
                char.unread_count = 0;
            }
            return char;
        }
        return null;
    }

    /**
     * 触发一条 msg_pool 中的消息
     * @param {object} socialData
     * @param {string} charId
     * @param {string} [targetMsgId]
     */
    triggerMessage(socialData, charId, targetMsgId) {
        const data = this._normalizeData(socialData);
        const char = data[charId];
        if (!char || !char.msg_pool || char.msg_pool.length === 0) return;

        let story = null;
        if (targetMsgId) {
            for (let i = 0; i < char.msg_pool.length; i++) {
                if (char.msg_pool[i].id === targetMsgId) {
                    story = char.msg_pool.splice(i, 1)[0];
                    break;
                }
            }
        } else {
            story = char.msg_pool.shift();
        }

        if (!story) return;

        if (char.pending_options && char.pending_options.length > 0) {
            if (!char.msg_queue) char.msg_queue = [];
            char.msg_queue.push(story);
        } else {
            this._applyMsg(char, story);
        }
    }

    /**
     * 触发一条 proactive_pool 中的主动消息
     * @param {object} socialData
     * @param {string} charId
     * @param {string} [targetMsgId]
     */
    triggerProactiveMessage(socialData, charId, targetMsgId) {
        const data = this._normalizeData(socialData);
        const char = data[charId];
        if (!char || !char.proactive_pool || char.proactive_pool.length === 0) return;

        let story = null;
        if (targetMsgId) {
            for (let i = 0; i < char.proactive_pool.length; i++) {
                if (char.proactive_pool[i].id === targetMsgId) {
                    story = char.proactive_pool.splice(i, 1)[0];
                    break;
                }
            }
        } else {
            story = char.proactive_pool.shift();
        }

        if (!story) return;

        if (char.pending_options && char.pending_options.length > 0 && !story.event_only) {
            if (!char.msg_queue) char.msg_queue = [];
            char.msg_queue.push(story);
        } else {
            this._applyMsg(char, story);
        }
    }

    /**
     * 将 story 消息应用到角色的聊天历史中
     * @param {object} charObj
     * @param {object} storyObj
     */
    _applyMsg(charObj, storyObj) {
        if (!charObj.history) charObj.history = [];
        const history = charObj.history;

        // 主动消息：有 title 字段，不添加气泡，只设置 pending_title 和待选项
        if ('title' in storyObj) {
            charObj.pending_title = SocialManager._safeStr(storyObj.title || '');
            charObj.pending_options = this._normalizeOptions(storyObj.options || []);
            charObj.unread_count = (charObj.unread_count || 0) + 1;
            charObj.last_time = 'just now';
            return;
        }

        if ('player_content' in storyObj) {
            history.push({ role: 'me', content: SocialManager._safeStr(storyObj.player_content || '') });
            history.push({ role: 'other', content: SocialManager._safeStr(storyObj.reply || '') });
            charObj.pending_options = [];
            charObj.unread_count = (charObj.unread_count || 0) + 1;
            charObj.last_time = 'just now';
            return;
        }

        const content = SocialManager._safeStr(storyObj.content || '');
        history.push({ role: 'other', content: content });
        charObj.pending_options = this._normalizeOptions(storyObj.options || []);
        if (content) {
            charObj.unread_count = (charObj.unread_count || 0) + 1;
        }
        charObj.last_time = 'just now';
    }

    /**
     * 玩家发送回复
     * @param {object} socialData
     * @param {string} charId
     * @param {string} optionText
     */
    postReply(socialData, charId, optionText) {
        const data = this._normalizeData(socialData);
        const char = data[charId];
        if (!char) return;

        let selectedOption = null;
        for (const opt of (char.pending_options || [])) {
            if (typeof opt === 'object' && opt.text === optionText) {
                selectedOption = opt;
                break;
            }
        }

        const replyEntry = { role: 'me', content: SocialManager._safeStr(optionText) };
        if (selectedOption && selectedOption.send_image) {
            replyEntry.image_url = SocialManager._safeStr(selectedOption.image_url || '');
        }
        if (!char.history) char.history = [];
        char.history.push(replyEntry);
        char.pending_options = [];
        char.pending_title = '';

        const nextStory = this._pickNextStoryAfterReply(char, selectedOption);
        if (nextStory) {
            this._applyMsg(char, nextStory);
        }
    }

    /**
     * 每月为每个角色随机触发一条消息
     * @param {object} socialData
     */
    triggerMonthlyMessages(socialData) {
        const data = this._normalizeData(socialData);
        for (const char of Object.values(data)) {
            if (typeof char !== 'object' || char === null) continue;

            // 当前有待回复对话，本月跳过
            if ((char.pending_options && char.pending_options.length > 0) || char.pending_title) {
                continue;
            }

            const pool = char.msg_pool || [];
            const proactive = char.proactive_pool || [];
            const allCandidates = [];
            for (let i = 0; i < pool.length; i++) {
                allCandidates.push({ kind: 'pool', idx: i });
            }
            for (let i = 0; i < proactive.length; i++) {
                if (!proactive[i].event_only) {
                    allCandidates.push({ kind: 'proactive', idx: i });
                }
            }
            if (allCandidates.length === 0) continue;

            const idle = char.msg_idle_months || 0;
            const prob = Math.min(1.0, (idle + 1) * 0.35);

            if (Math.random() < prob) {
                const chosen = allCandidates[Math.floor(Math.random() * allCandidates.length)];
                let story;
                if (chosen.kind === 'pool') {
                    story = pool.splice(chosen.idx, 1)[0];
                } else {
                    story = proactive.splice(chosen.idx, 1)[0];
                }
                this._applyMsg(char, story);
                char.msg_idle_months = 0;
            } else {
                char.msg_idle_months = idle + 1;
            }
        }
    }

    /**
     * 选择回复后的下一个 story
     * @param {object} charObj
     * @param {object|null} selectedOption
     * @returns {object|null}
     */
    _pickNextStoryAfterReply(charObj, selectedOption) {
        if (typeof selectedOption === 'object' && selectedOption !== null) {
            const optionStory = selectedOption.next_story || selectedOption.next;
            if (typeof optionStory === 'object' && optionStory !== null) {
                return optionStory;
            }
            if (typeof optionStory === 'string') {
                return {
                    content: optionStory,
                    options: this._normalizeOptions(selectedOption.next_options || []),
                };
            }

            const targetId = selectedOption.next_id || selectedOption.trigger_id;
            if (targetId) {
                const msgPool = charObj.msg_pool || [];
                for (let i = 0; i < msgPool.length; i++) {
                    if (typeof msgPool[i] === 'object' && msgPool[i].id === targetId) {
                        return msgPool.splice(i, 1)[0];
                    }
                }
            }
        }

        if (charObj.msg_queue && charObj.msg_queue.length > 0) {
            return charObj.msg_queue.shift();
        }

        return null;
    }
}
