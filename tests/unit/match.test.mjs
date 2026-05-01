import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateMatch, simulateGsMatch, simulateWta1000Match } from '../../static/js/match.js';
import { TennisGirl } from '../../static/js/character.js';
import { withConstantRandom } from '../helpers/random.mjs';

function strongPlayer() {
  const player = new TennisGirl('小夏', '', '底线力量型');
  player.power = 100;
  player.technique = 100;
  player.agility = 100;
  player.wisdom = 100;
  player.perseverance = 100;
  player.general_stats = 240;
  return player;
}

test('ordinary match can produce a deterministic championship and WTA points record', () => {
  const player = strongPlayer();
  const ranking = {};
  const event = {
    id: 1,
    name: 'W15 Test',
    level_code: 'W15',
    req_stats: 20,
    points_table: [1, 5, 10, 20, 40, 80]
  };

  const [round, points, logs] = withConstantRandom(0.5, () => simulateMatch(player, event, ranking));

  assert.equal(round, '冠军');
  assert.equal(points, 80);
  assert(logs.some(line => line.includes('冠军')));
  assert.equal(ranking.WTA.summary.total_effective_points, 80);
  assert.equal(ranking.WTA.point_history[0].desc, 'W15 Test (冠军)');
});

test('weak player exits in the opening round with first-round points', () => {
  const player = new TennisGirl('小夏', '', '灵巧战术型');
  const ranking = {};
  const event = {
    id: 2,
    name: 'CTJ Test',
    level_code: 'A',
    req_stats: 200,
    points_table: [2, 8, 16, 32, 64, 128]
  };

  const [round, points, logs] = withConstantRandom(0.5, () => simulateMatch(player, event, ranking));

  assert.equal(round, 'R32');
  assert.equal(points, 2);
  assert(logs[0].includes('遗憾落败'));
  assert.equal(ranking.CTJ.summary.total_effective_points, 2);
});

test('WTA1000 uses a 64 draw and GS uses a 128 draw', () => {
  const player = strongPlayer();
  const ranking = {};
  const wta1000 = {
    name: 'WTA1000 Test',
    level_code: 'WTA1000',
    req_stats: 20,
    points_table: [1, 10, 120, 215, 390, 650, 1000]
  };
  const gs = {
    name: 'GS Test',
    level_code: 'GS',
    req_stats: 20,
    points_table: [10, 70, 130, 240, 430, 780, 1300, 2000]
  };

  const [wtaRound] = withConstantRandom(0.5, () => simulateWta1000Match(player, wta1000, ranking));
  const [gsRound] = withConstantRandom(0.5, () => simulateGsMatch(player, gs, ranking));

  assert.equal(wtaRound, '冠军');
  assert.equal(gsRound, '冠军');
  assert.equal(ranking.WTA.point_history.length, 2);
  assert.equal(ranking.WTA.summary.total_effective_points, 3000);
});
