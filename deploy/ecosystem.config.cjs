/* eslint-disable @typescript-eslint/no-require-imports -- PM2 loads ecosystem files as CommonJS. */
const { readFileSync, realpathSync } = require('node:fs');
const { parseEnv } = require('node:util');
const root = '/var/www/budget.jonmb.com/app';
const env = parseEnv(readFileSync(`${root}/shared/.env`, 'utf8'));
module.exports = {
  apps: [{
    name: 'budget-app',
    cwd: realpathSync(`${root}/current`),
    script: 'server.js',
    interpreter: process.execPath,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    time: true,
    env: {
      ...env,
      NODE_ENV: 'production',
      HOSTNAME: '127.0.0.1',
      PORT: '3003',
      BUDGET_APP_SESSION_DIR: `${root}/shared/sessions`,
    },
  }],
};
