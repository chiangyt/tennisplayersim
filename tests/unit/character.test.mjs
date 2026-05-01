import test from 'node:test';
import assert from 'node:assert/strict';
import { TennisGirl } from '../../static/js/character.js';

test('new player starts with expected baseline stats', () => {
  const player = new TennisGirl('小夏', '', '底线力量型');

  assert.equal(player.year, 2024);
  assert.equal(player.month, 1);
  assert.equal(player.age, 12);
  assert.equal(player.stamina, 100);
  assert.equal(player.mood, 100);
  assert.equal(player.power, 10);
  assert.equal(player.technique, 10);
  assert.equal(player.agility, 10);
  assert.equal(player.general_stats, 24);
});

test('monthly actions clamp stamina and mood to valid meter range', () => {
  const player = new TennisGirl('小夏', '', '灵巧战术型');
  player.stamina = 20;
  player.mood = 95;

  player.executePlan(['play_game', 'play_game', 'play_game', 'play_game'], {}, {});

  assert.equal(player.stamina, 0);
  assert.equal(player.mood, 100);
});

test('training applies playstyle gain and recalculates comprehensive ability', () => {
  const player = new TennisGirl('小夏', '', '底线力量型');

  const message = player.train('power');

  assert.match(message, /力量/);
  assert.equal(player.stamina, 75);
  assert.equal(player.power, 11.3);
  assert.equal(player.general_stats, (11.3 + 10 + 10) * 0.7 + 10 * 0.2 + 10 * 0.1);
});

test('quarterly allowance is granted every three completed months', () => {
  const player = new TennisGirl('小夏', '', '跑动防守型');

  player.updateTimeAndAge();
  player.updateTimeAndAge();
  player.updateTimeAndAge();

  assert.equal(player.month, 4);
  assert.equal(player.money, 1500);
  assert(player.log.some(entry => entry.includes('生活费')));
});

test('ITF travel fee is free on first professional entry and charged afterward', () => {
  const player = new TennisGirl('小夏', '', '底线力量型');
  player.month = 2;
  player.money = 6000;
  const event = { id: 1, name: 'W15 Test', level_code: 'W15', points: [1, 2, 3, 4, 5, 6], req_stats: 30 };

  const first = player.applyForTournament(event);
  assert.equal(first.ok, true);
  assert.equal(first.showProfessionalItfIntro, true);
  assert.equal(player.money, 6000);

  player.month = 3;
  const second = player.applyForTournament(event);
  assert.equal(second.ok, true);
  assert.equal(player.money, 1000);

  player.month = 4;
  const third = player.applyForTournament(event);
  assert.equal(third.ok, false);
  assert.equal(player.money, 1000);
});

test('item use consumes inventory and clamps positive effects', () => {
  const player = new TennisGirl('小夏', '', '灵巧战术型');
  player.stamina = 90;
  player.mood = 95;
  player.inventory.energy = 1;

  const result = player.useItem({
    id: 'energy',
    name: '能量饮料',
    effect: { stamina: 20, mood: 10 }
  });

  assert.equal(result.ok, true);
  assert.equal(player.stamina, 100);
  assert.equal(player.mood, 100);
  assert.equal(player.inventory.energy, undefined);
});
