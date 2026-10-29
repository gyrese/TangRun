import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import {createLeaderboard,leaderboardMiddleware} from './server/leaderboard.js';
export default defineConfig({plugins:[{
 name:'tangrun-leaderboard',
 configureServer(server){server.middlewares.use(leaderboardMiddleware(createLeaderboard(resolve(process.env.LEADERBOARD_FILE||'data/leaderboard.json'))));},
 configurePreviewServer(server){server.middlewares.use(leaderboardMiddleware(createLeaderboard(resolve(process.env.LEADERBOARD_FILE||'data/leaderboard.json'))));}
}]});
