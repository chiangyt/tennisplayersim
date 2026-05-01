import test from 'node:test';
import assert from 'node:assert/strict';
import { SocialManager } from '../../static/js/social.js';

test('locked NPCs are hidden until unlocked', () => {
  const mgr = new SocialManager();
  const data = {
    mom: { name: '妈妈', history: [], unread_count: 0 },
    rival_player: {
      name: '劲敌',
      unlocked: false,
      history: [],
      proactive_pool: [{ id: 'rival_unlock', title: '第一次对视', options: [{ text: '你好' }] }]
    }
  };

  assert.deepEqual(Object.keys(mgr.getAllChats(data)), ['mom']);

  const cutscene = mgr.unlockNpc(data, 'rival_player', 'rival_unlock');

  assert.equal(cutscene.charId, 'rival_player');
  assert.equal(cutscene.story.id, 'rival_unlock');
  assert.deepEqual(Object.keys(mgr.getAllChats(data)).sort(), ['mom', 'rival_player']);
  assert.equal(mgr.unlockNpc(data, 'rival_player', 'rival_unlock'), null);
});

test('chat detail clears unread count', () => {
  const mgr = new SocialManager();
  const data = {
    mom: { name: '妈妈', history: [], unread_count: 3 }
  };

  const chat = mgr.getChatDetail(data, 'mom');

  assert.equal(chat.unread_count, 0);
  assert.equal(data.mom.unread_count, 0);
});

test('reply applies next story and clears pending title', () => {
  const mgr = new SocialManager();
  const data = {
    coach: {
      name: '教练',
      history: [{ role: 'other', content: '今天练什么？' }],
      pending_title: '训练安排',
      pending_options: [
        {
          text: '练力量',
          next_story: { content: '好，先做基础力量。', options: [{ text: '明白' }] }
        }
      ]
    }
  };

  mgr.postReply(data, 'coach', '练力量');

  assert.equal(data.coach.pending_title, '');
  assert.equal(data.coach.history.at(-2).content, '练力量');
  assert.equal(data.coach.history.at(-1).content, '好，先做基础力量。');
  assert.deepEqual(data.coach.pending_options.map(opt => opt.text), ['明白']);
});

test('monthly messages skip locked NPCs and pending conversations', () => {
  const mgr = new SocialManager();
  const data = {
    mom: {
      name: '妈妈',
      history: [],
      pending_options: [{ text: '还没回复' }],
      msg_pool: [{ content: '新消息' }]
    },
    rival: {
      name: '劲敌',
      unlocked: false,
      history: [],
      msg_pool: [{ content: '不会出现' }]
    }
  };

  mgr.triggerMonthlyMessages(data);

  assert.equal(data.mom.history.length, 0);
  assert.equal(data.rival.history.length, 0);
});
