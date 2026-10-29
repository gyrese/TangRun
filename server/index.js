import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {createLeaderboard,leaderboardMiddleware} from './leaderboard.js';
const board=createLeaderboard(resolve(process.env.LEADERBOARD_FILE||'data/leaderboard.json'));
const handler=leaderboardMiddleware(board);
createServer((req,res)=>handler(req,res,()=>{res.writeHead(404);res.end();})).listen(Number(process.env.API_PORT||3001),'0.0.0.0');
