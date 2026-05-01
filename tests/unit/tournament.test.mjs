import test from 'node:test';
import assert from 'node:assert/strict';
import { findEventById, getEventsForPlayer, getMonthlyMatches, loadTournaments } from '../../static/js/tournament.js';

const staticData = {
  CTJ: {
    A: [{ id: 1, name: 'CTJ A', month: 2, level_code: 'A', points: [1, 2, 3, 4, 5, 6], req_stats: 10 }]
  },
  ITF_Junior: {
    J60: [{ id: 2, name: 'Junior', month: 2, level_code: 'J60', points: [1, 2, 3, 4, 5, 6], req_stats: 20 }]
  },
  ITF: {
    W15: [{ id: 3, name: 'W15', month: 2, level_code: 'W15', req_ranking: 50, points: [1, 2, 3, 4, 5, 6], req_stats: 30 }]
  },
  WTA: {
    WTA250: [{ id: 4, name: 'WTA250', month: 2, level_code: 'WTA250', req_ranking: 120, points: [1, 2, 3, 4, 5, 6], req_stats: 40 }]
  }
};

test('loadTournaments returns preloaded data unchanged', () => {
  assert.equal(loadTournaments(staticData), staticData);
});

test('age rules expose the expected tournament systems', () => {
  const age12 = getEventsForPlayer(structuredClone(staticData), 12, 2, {});
  const age13 = getEventsForPlayer(structuredClone(staticData), 13, 2, {});
  const age15 = getEventsForPlayer(structuredClone(staticData), 15, 2, {});

  assert.deepEqual(age12.map(e => e.system_tag), ['CTJ']);
  assert.deepEqual(age13.map(e => e.system_tag).sort(), ['CTJ', 'ITF_Junior']);
  assert.deepEqual(age15.map(e => e.system_tag).sort(), ['ITF', 'ITF_Junior', 'WTA']);
});

test('rank gates lock ITF and WTA events when points or rank are insufficient', () => {
  const events = getEventsForPlayer(structuredClone(staticData), 15, 2, { WTA: 10 }, { WTA: 9999 });
  const itf = events.find(e => e.id === 3);
  const wta = events.find(e => e.id === 4);

  assert.equal(itf.is_rank_locked, true);
  assert.equal(wta.is_rank_locked, true);

  const unlocked = getEventsForPlayer(structuredClone(staticData), 15, 2, { WTA: 50 }, { WTA: 100 });
  assert.equal(unlocked.find(e => e.id === 3).is_rank_locked, false);
  assert.equal(unlocked.find(e => e.id === 4).is_rank_locked, false);
});

test('event lookup and monthly lookup traverse all systems', () => {
  assert.equal(findEventById(staticData, 4).name, 'WTA250');
  assert.equal(findEventById(staticData, 999), null);
  assert.equal(getMonthlyMatches(staticData, 2).length, 4);
  assert.equal(getMonthlyMatches(staticData, 7).length, 0);
});
