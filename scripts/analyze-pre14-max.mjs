const CONFIG = {
  startYear: 2024,
  startMonth: 1,
  startAge: 12,
  monthsBefore14: 24,
  weeksPerMonth: 4,
  initialStamina: 100,
  initialMood: 100,
  initialMoney: 500,
  initialGeneral: 24,
  quarterlyAllowance: 1000,
  specialtyTrainGeneralGain: 1.3 * 0.7,
  lowMoodSpecialtyTrainGeneralGain: 1.3 * 0.7 * 0.7,
  wisdomGeneralGain: 1 * 0.2,
  lowMoodWisdomGeneralGain: 0.8 * 0.2,
  ctjChampionGeneralGain: 1.4,
  juniorGrandSlamChampionGeneralGain: 1.6,
  ctjHardWinEventGeneralGain: 5 * 0.1,
  energyDrink: { code: 'E', price: 300, stamina: 25 },
  moodCandy: { code: 'C', price: 500, mood: 20 },
};

const ACTIONS = {
  T: { label: '专项训练', stamina: -25, mood: -5 },
  W: { label: '智慧训练', stamina: -20, mood: -5 },
  R: { label: '休息', stamina: 30, mood: 5 },
  G: { label: '打游戏', stamina: -10, mood: 20 },
  M: { label: '比赛', stamina: -50, mood: 10 },
  E: { label: '能量饮料', stamina: 25 },
  C: { label: '心情糖', mood: 20 },
};

function clampMeter(value) {
  return Math.max(0, Math.min(100, value));
}

function monthInfo(monthIndex) {
  const year = CONFIG.startYear + Math.floor((CONFIG.startMonth - 1 + monthIndex) / 12);
  const month = ((CONFIG.startMonth - 1 + monthIndex) % 12) + 1;
  let match = null;

  // Registration is for the next month, so the opening month cannot already
  // contain a match in a fresh save.
  if (monthIndex >= 1) {
    match = {
      label: 'CTJ',
      generalGain: CONFIG.ctjChampionGeneralGain,
    };

    // At age 13, junior grand slams are the best available match-growth ceiling.
    if (year === 2025 && [5, 7, 9].includes(month)) {
      match = {
        label: 'ITF Junior GS',
        generalGain: CONFIG.juniorGrandSlamChampionGeneralGain,
      };
    }
  }

  return { year, month, match };
}

function putBest(map, key, value) {
  const old = map.get(key);
  if (!old || value.general > old.general) {
    map.set(key, value);
  }
}

function summarizePath(path) {
  return path.reduce((counts, code) => {
    const actionCode = code.split(':')[0];
    counts[actionCode] = (counts[actionCode] || 0) + 1;
    return counts;
  }, {});
}

function formatCounts(counts) {
  const order = ['T', 'W', 'M', 'R', 'G', 'E', 'C'];
  return order
    .filter(code => counts[code])
    .map(code => `${ACTIONS[code].label}(${code}): ${counts[code]}`)
    .join(', ');
}

function applyPurchasesUntilStable(states, monthIndex) {
  let changed = true;

  while (changed) {
    changed = false;
    for (const [key, value] of Array.from(states.entries())) {
      const parts = key.split(',').map(Number);
      const [stamina, mood, money] = parts;
      const tail = parts.slice(3);

      if (money >= CONFIG.energyDrink.price && stamina < 100) {
        const nextKey = [
          clampMeter(stamina + CONFIG.energyDrink.stamina),
          mood,
          money - CONFIG.energyDrink.price,
          ...tail,
        ].join(',');
        const nextValue = {
          general: value.general,
          path: [...value.path, `${CONFIG.energyDrink.code}:${monthIndex}`],
        };
        const old = states.get(nextKey);
        if (!old || nextValue.general > old.general) {
          states.set(nextKey, nextValue);
          changed = true;
        }
      }

      if (money >= CONFIG.moodCandy.price && mood < 100) {
        const nextKey = [
          stamina,
          clampMeter(mood + CONFIG.moodCandy.mood),
          money - CONFIG.moodCandy.price,
          ...tail,
        ].join(',');
        const nextValue = {
          general: value.general,
          path: [...value.path, `${CONFIG.moodCandy.code}:${monthIndex}`],
        };
        const old = states.get(nextKey);
        if (!old || nextValue.general > old.general) {
          states.set(nextKey, nextValue);
          changed = true;
        }
      }
    }
  }

  return states;
}

function solve({ includeShopConsumables, allowMatches }) {
  let states = new Map();
  // State key outside a month:
  // stamina,mood,money,ctjHardWinEventUsed
  states.set(
    [
      CONFIG.initialStamina,
      CONFIG.initialMood,
      includeShopConsumables ? CONFIG.initialMoney : 0,
      0,
    ].join(','),
    { general: CONFIG.initialGeneral, path: [] }
  );

  for (let monthIndex = 0; monthIndex < CONFIG.monthsBefore14; monthIndex += 1) {
    const currentMonth = monthInfo(monthIndex);

    if (includeShopConsumables) {
      states = applyPurchasesUntilStable(states, monthIndex);
    }

    // Add per-month match-used flag.
    let monthStates = new Map();
    for (const [key, value] of states) {
      putBest(monthStates, `${key},0`, value);
    }

    for (let week = 0; week < CONFIG.weeksPerMonth; week += 1) {
      if (includeShopConsumables) {
        monthStates = applyPurchasesUntilStable(monthStates, monthIndex);
      }

      const next = new Map();
      for (const [key, value] of monthStates) {
        const [stamina, mood, money, eventUsed, matchUsed] = key.split(',').map(Number);
        const actionCodes = ['T', 'W', 'R', 'G'];
        if (allowMatches && currentMonth.match && !matchUsed) actionCodes.push('M');

        for (const code of actionCodes) {
          let nextStamina = stamina;
          let nextMood = mood;
          let nextMoney = money;
          let nextEventUsed = eventUsed;
          let nextMatchUsed = matchUsed;
          let generalGain = 0;

          if (code === 'T') {
            if (nextStamina < 25) continue;
            nextStamina -= 25;
            nextMood = clampMeter(nextMood - 5);
            generalGain = nextMood < 30
              ? CONFIG.lowMoodSpecialtyTrainGeneralGain
              : CONFIG.specialtyTrainGeneralGain;
          } else if (code === 'W') {
            if (nextStamina < 20) continue;
            nextStamina -= 20;
            nextMood = clampMeter(nextMood - 5);
            generalGain = nextMood < 30
              ? CONFIG.lowMoodWisdomGeneralGain
              : CONFIG.wisdomGeneralGain;
          } else if (code === 'R') {
            nextStamina = clampMeter(nextStamina + 30);
            nextMood = clampMeter(nextMood + 5);
          } else if (code === 'G') {
            if (nextStamina < 10) continue;
            nextStamina -= 10;
            nextMood = clampMeter(nextMood + 20);
          } else if (code === 'M') {
            if (nextStamina < 50) continue;
            nextStamina -= 50;
            nextMood = clampMeter(nextMood + 10);
            nextMatchUsed = 1;
            generalGain = currentMonth.match.generalGain;
            if (!nextEventUsed && currentMonth.match.label === 'CTJ') {
              generalGain += CONFIG.ctjHardWinEventGeneralGain;
              nextEventUsed = 1;
            }
          }

          putBest(
            next,
            [nextStamina, nextMood, nextMoney, nextEventUsed, nextMatchUsed].join(','),
            {
              general: value.general + generalGain,
              path: [...value.path, `${code}:${monthIndex}`],
            }
          );
        }
      }
      monthStates = next;
    }

    states = new Map();
    for (const [key, value] of monthStates) {
      const parts = key.split(',').map(Number);
      parts.pop(); // remove monthly match-used flag

      const elapsedMonths = monthIndex + 1;
      if (includeShopConsumables && elapsedMonths > 0 && elapsedMonths % 3 === 0) {
        parts[2] += CONFIG.quarterlyAllowance;
      }

      putBest(states, parts.join(','), value);
    }
  }

  let bestKey = '';
  let bestValue = null;
  for (const [key, value] of states) {
    if (!bestValue || value.general > bestValue.general) {
      bestKey = key;
      bestValue = value;
    }
  }

  const [stamina, mood, money, eventUsed] = bestKey.split(',').map(Number);
  return {
    general: Number(bestValue.general.toFixed(3)),
    stamina,
    mood,
    money,
    ctjHardWinEventUsed: Boolean(eventUsed),
    counts: summarizePath(bestValue.path),
    monthlyPath: Array.from({ length: CONFIG.monthsBefore14 }, (_, i) => {
      const info = monthInfo(i);
      const entries = bestValue.path
        .map(entry => {
          const [code, month] = entry.split(':');
          return { code, month: Number(month) };
        })
        .filter(entry => entry.month === i);
      const weeklyActions = entries
        .filter(entry => ['T', 'W', 'R', 'G', 'M'].includes(entry.code))
        .map(entry => entry.code);
      const itemActions = entries
        .filter(entry => ['E', 'C'].includes(entry.code))
        .map(entry => entry.code);
      const suffix = itemActions.length > 0 ? ` | 道具: ${itemActions.join(' ')}` : '';
      return `${info.year}-${String(info.month).padStart(2, '0')}: ${weeklyActions.join(' ')}${suffix}`;
    }),
  };
}

function printResult(title, result) {
  console.log(`\n${title}`);
  console.log(`综合能力上限: ${result.general}`);
  console.log(`结束状态: 体力 ${result.stamina}, 心情 ${result.mood}, 资金 ${result.money}`);
  console.log(`动作计数: ${formatCounts(result.counts)}`);
  console.log('月度路径:');
  for (const line of result.monthlyPath) {
    console.log(`  ${line}`);
  }
}

console.log('14岁前最高综合能力动态规划分析');
console.log('假设: 24个月/96周；每月最多1场比赛；比赛真实扣体力-50；比赛全部按夺冠且随机成长取上限。');
console.log('动作: T=专项训练, W=智慧训练, M=比赛, R=休息, G=打游戏, E=能量饮料, C=心情糖。');

printResult('不比赛，只训练/休息/打游戏，不使用商城消耗品', solve({
  includeShopConsumables: false,
  allowMatches: false,
}));
printResult('不比赛，只训练/休息/打游戏，允许购买并立即使用商城消耗品', solve({
  includeShopConsumables: true,
  allowMatches: false,
}));
printResult('允许比赛，不使用商城消耗品', solve({
  includeShopConsumables: false,
  allowMatches: true,
}));
printResult('允许比赛，允许购买并立即使用商城消耗品', solve({
  includeShopConsumables: true,
  allowMatches: true,
}));
