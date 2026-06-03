/** @type {import('pm2').StartOptions[]} */
module.exports = {
  apps: [
    {
      name: 'event-organisation-calendar',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'server/production-server.ts',
      interpreter: 'node',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 4173,
      },
    },
  ],
}
