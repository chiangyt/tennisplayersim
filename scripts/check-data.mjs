import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const dataDir = join(root, 'static', 'data');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assertTournamentData(filename) {
  const data = readJson(join(dataDir, filename));
  let eventCount = 0;

  for (const [level, events] of Object.entries(data)) {
    assert(Array.isArray(events), `${filename}:${level} must be an array`);
    for (const event of events) {
      eventCount += 1;
      assert(Number.isInteger(event.id), `${filename}:${level} event id must be integer`);
      assert(typeof event.name === 'string' && event.name.length > 0, `${filename}:${event.id} missing name`);
      assert(Number.isInteger(event.month) && event.month >= 1 && event.month <= 12, `${filename}:${event.id} invalid month`);
      assert(typeof event.level_code === 'string' && event.level_code.length > 0, `${filename}:${event.id} missing level_code`);
      assert(Array.isArray(event.points) && event.points.length >= 6, `${filename}:${event.id} invalid points table`);
      assert(event.points.every(Number.isFinite), `${filename}:${event.id} points must be numeric`);
      assert(Number.isFinite(event.req_stats), `${filename}:${event.id} invalid req_stats`);
    }
  }

  assert(eventCount > 0, `${filename} has no events`);
}

function assertShopData() {
  const shop = readJson(join(dataDir, 'shop.json'));
  const allItems = [...(shop.consumables || []), ...(shop.gifts || [])];
  const ids = new Set();

  assert(allItems.length > 0, 'shop.json has no items');
  for (const item of allItems) {
    assert(typeof item.id === 'string' && item.id.length > 0, 'shop item missing id');
    assert(!ids.has(item.id), `duplicate shop item id: ${item.id}`);
    ids.add(item.id);
    assert(typeof item.name === 'string' && item.name.length > 0, `${item.id} missing name`);
    assert(Number.isFinite(item.price) && item.price >= 0, `${item.id} invalid price`);
  }
}

for (const entry of readdirSync(dataDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.json')) {
    readJson(join(dataDir, entry.name));
  }
}

for (const filename of ['ctj.json', 'itf_junior.json', 'itf.json', 'wta.json']) {
  assertTournamentData(filename);
}

assertShopData();

console.log('Data files parsed and core schemas passed.');
