import http from 'http';
import cron from 'node-cron';
import { writeFSWHiscores } from './parser.js';
import { writeToJson } from './builder.js';

const address = '127.0.0.1';
const port = 3000;

let app = http.createServer(() => { });

app.listen(port, address);

console.log(`Node server running on port ${port}`);

cron.schedule('0 * * * *', async () => {
    const response = [];

    for (let i = 0; i <= 28; i++) {
        response.push(await writeFSWHiscores(i, 4));
    }

    console.clear();
    console.log([`Node server running on port ${port}`, `Updated at ${new Date()}`, ...response].join('\n'));
});

cron.schedule('30 22 * * *', async () => {
    await writeToJson(Date.now());
})