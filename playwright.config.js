import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:'./tests/browser',timeout:90000,workers:1,
  use:{baseURL:'http://127.0.0.1:5180',viewport:{width:1440,height:1100},launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined}},
  webServer:{command:'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5180 --strictPort',url:'http://127.0.0.1:5180',reuseExistingServer:true,timeout:30000},
});
