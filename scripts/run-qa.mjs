import { spawnSync } from 'node:child_process';

function run(label, args) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    stdio: 'inherit'
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('JavaScript syntax', ['scripts/check-js-syntax.mjs']);
run('Data validation', ['scripts/check-data.mjs']);
run('Unit tests', ['scripts/run-unit-tests.mjs']);
