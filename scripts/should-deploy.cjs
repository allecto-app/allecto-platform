#!/usr/bin/env node

/**
 * Vercel "Ignored Build Step" helper.
 * Usage: `node scripts/should-deploy.cjs <path-or-glob> [...more]`
 * Exits with code 0 to skip the build when none of the provided paths changed.
 */

const { spawnSync } = require('node:child_process');

const targets = process.argv.slice(2);

if (!targets.length) {
  console.error('[should-deploy] Provide at least one path or glob to watch.');
  process.exit(1);
}

const head = process.env.VERCEL_GIT_COMMIT_SHA || 'HEAD';

function resolveBaseCommit() {
  if (process.env.VERCEL_GIT_PREVIOUS_SHA) {
    return process.env.VERCEL_GIT_PREVIOUS_SHA;
  }

  const revList = spawnSync('git', ['rev-list', '-n', '2', head], {
    encoding: 'utf8',
  });

  if (revList.status !== 0) {
    return null;
  }

  const commits = revList.stdout.trim().split('\n');
  return commits.length === 2 ? commits[1] : null;
}

const base = resolveBaseCommit();

if (!base) {
  console.log(
    '[should-deploy] Unable to determine previous commit. Continuing with deploy.'
  );
  process.exit(1);
}

const diff = spawnSync('git', ['diff', '--name-only', base, head, '--', ...targets], {
  encoding: 'utf8',
});

if (diff.status !== 0) {
  console.error('[should-deploy] Failed to run git diff:\n', diff.stderr);
  process.exit(1);
}

const changedFiles = diff.stdout
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

if (changedFiles.length === 0) {
  console.log(
    `[should-deploy] No changes in [${targets.join(', ')}] between ${base.slice(
      0,
      7
    )} and ${head.slice(0, 7)}. Skipping deploy.`
  );
  process.exit(0);
}

const preview = changedFiles.slice(0, 5).join(', ');
const more = changedFiles.length > 5 ? ` (+${changedFiles.length - 5} more)` : '';

console.log(
  `[should-deploy] Changes detected (${preview}${more}). Proceeding with deploy.`
);
process.exit(1);
