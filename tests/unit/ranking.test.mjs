import test from 'node:test';
import assert from 'node:assert/strict';
import { RankingManager, computeProfessionalRank } from '../../static/js/ranking.js';

test('refreshRanking keeps only active 12-month CTJ records and marks best eight effective', () => {
  const rm = new RankingManager();
  const ranking = {
    CTJ: {
      summary: {},
      point_history: [
        { year: 2024, month: 1, points: 999 },
        { year: 2024, month: 5, points: 30 },
        { year: 2024, month: 6, points: 80 },
        { year: 2024, month: 7, points: 20 },
        { year: 2024, month: 8, points: 60 },
        { year: 2024, month: 9, points: 10 },
        { year: 2024, month: 10, points: 50 },
        { year: 2024, month: 11, points: 40 },
        { year: 2024, month: 12, points: 70 },
        { year: 2025, month: 1, points: 90 }
      ]
    }
  };

  const total = rm.refreshRanking(ranking, 2025, 1, 12);

  assert.equal(ranking.CTJ.point_history.length, 9);
  assert.equal(total, 440);
  assert.equal(ranking.CTJ.point_history.filter(p => p.is_effective).length, 8);
  assert.equal(ranking.CTJ.summary.ranking_system, 'Best-of-8');
});

test('getAllRankings returns zero for missing systems', () => {
  const rm = new RankingManager();
  const result = rm.getAllRankings({
    CTJ: { summary: { total_effective_points: 88 } },
    WTA: { summary: { total_effective_points: 12 } }
  });

  assert.deepEqual(result, { CTJ: 88, ITF_Junior: 0, ITF: 0, WTA: 12 });
});

test('professional rank compares against NPC rankings and interpolation table', () => {
  const npcs = [
    { name: 'A', points: 5000 },
    { name: 'B', points: 3000 },
    { name: 'C', points: 1000 }
  ];

  assert.equal(computeProfessionalRank(0, npcs), null);
  assert.equal(computeProfessionalRank(3500, npcs), 2);
  assert.equal(computeProfessionalRank(600, npcs), 130);
  assert.equal(computeProfessionalRank(5, []), 1500);
});
