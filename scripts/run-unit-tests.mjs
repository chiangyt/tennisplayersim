import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const unitDir = join(process.cwd(), 'tests', 'unit');
const testFiles = readdirSync(unitDir)
  .filter(name => name.endsWith('.test.mjs'))
  .sort()
  .map(name => join(unitDir, name));

const result = spawnSync(process.execPath, ['--test', ...testFiles], {
  encoding: 'utf8',
  stdio: 'inherit'
});

process.exit(result.status ?? 1);
