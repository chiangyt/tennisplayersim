import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../../static/js/game-state.js';
import { installLocalStorageMock } from '../helpers/local-storage.mjs';

test('current game can be initialized, updated, saved, and loaded', () => {
  const storage = installLocalStorageMock();
  const player = { name: '小夏', year: 2024, month: 1 };
  const ranking = { CTJ: { summary: { total_effective_points: 0 }, point_history: [] } };
  const social = { mom: { name: '妈妈', history: [] } };
  const world = { competitors: [], wta: [], itf_junior: [] };

  GameState.init(player, ranking, social, world);
  assert.deepEqual(GameState.current.player, player);

  GameState.updatePlayer({ ...player, month: 2 });
  assert.equal(GameState.current.player.month, 2);

  assert.equal(GameState.saveSlot(1), true);
  GameState.current = null;
  assert.equal(storage.getItem(GameState.KEY), null);

  assert.equal(GameState.loadSlot(1), true);
  assert.equal(GameState.current.player.month, 2);
  assert.equal(GameState.getSlotInfo(1).empty, false);
});

test('import rejects malformed data and accepts player snapshots', () => {
  installLocalStorageMock();

  assert.equal(GameState.importSave('{bad json'), false);
  assert.equal(GameState.importSave(JSON.stringify({ ranking: {} })), false);
  assert.equal(GameState.importSave(JSON.stringify({ player: { name: '小夏' }, ranking: {} })), true);
  assert.equal(GameState.current.player.name, '小夏');
});

test('legacy ITF ranking history migrates into WTA on read', () => {
  installLocalStorageMock();
  const legacy = {
    player: { name: '小夏' },
    ranking: {
      ITF: { point_history: [{ points: 12, year: 2025, month: 1 }] },
      WTA: { point_history: [], summary: {} }
    },
    social: {},
    world: {}
  };

  GameState.current = legacy;

  const current = GameState.current;
  assert.equal(current.ranking.ITF, undefined);
  assert.equal(current.ranking.WTA.point_history.length, 1);
  assert.equal(current.ranking.WTA.point_history[0].points, 12);
});
