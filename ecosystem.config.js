// ecosystem.config.js
const os = require('os');
module.exports = {
  apps: [
    {
      port: 3010,
      name: 'colyseus',
      // script: './src/main.ts',
      script: './dist/main.js',
      instances: 2,
      exec_mode: 'fork', // IMPORTANT: do not use cluster mode.
      env: {
        // NODE_ENV: 'development',
      },
    },
  ],
};
