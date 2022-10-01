import fetch from 'node-fetch';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import * as jsdom from "jsdom";



const CONSOLIDATED_ARRAY = []

const INFLUX_URL = 'http://192.168.0.23:8086/';
const INFLUX_TOKEN = 'iCi9NAG_KNN5xEneM4LCH_c8vj5lIeT1db00joqix9KfUZ3He_16d7LSN4i3o6oG88qwxNYOnK2ASsk2oqoxSQ==';
const INFLUX_ORG = '0d5dfe51898d0c79';
const INFLUX_BUCKET = [
    'overall',
    'attack',
    'defence',
    'strength',
    'constitution',
    'ranged',
    'prayer',
    'magic',
    'cooking',
    'woodcutting',
    'fletching',
    'fishing',
    'firemaking',
    'crafting',
    'smithing',
    'mining',
    'herblore',
    'agility',
    'thieving',
    'slayer',
    'farming',
    'runecrafting',
    'hunter',
    'construction',
    'summoning',
    'dungeoneering',
    'divination',
    'invention',
    'archaeology'
];

const players = [
    'FSW GammaS',
    'FSWCardinal',
    'fsw dendofy',
    'Doddlert',
    'ToastieFox',
    'FSW Ridings',
    'goatmooo'
]

const influxDB = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });

async function getFSWHiscoresForPlayer(playerName) {

    CONSOLIDATED_ARRAY.length = 0;

    return new Promise(async (res, rej) => {
        try {
            const response = await fetch(`https://secure.runescape.com/m=hiscore_seasonal/compare?user1=${encodeURIComponent(playerName)}`)
            .then(res => res.text())
            .then(data => data);
    
            const HTML = new jsdom.JSDOM(response);
    
            const ROWS = HTML.window.document.querySelector('.headerBgLeft').rows;
    
            for (let i = 1; i < ROWS.length; i++) {
                const CELLS = ROWS[i].cells;
                const row = [i - 1];
    
                for (let j = 0; j < CELLS.length; j++) {
                    row.push(CELLS[j].innerHTML.replace(/<[\s\S]*?>/g, '').replace(/,/g, ''));
                }
    
                if (row[1] === '--') row[1] = "20000";
                if (row[2] === "--") row[2] = "0";
                if (row[3] === "--") row[3] = "1";
    
                CONSOLIDATED_ARRAY.push(row);
            }


            res(`Information successfully obtained for ${playerName}`);
        } catch (error) {
            res({ message: `Information failed to obtain for ${playerName}`, error });
        }
    })
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function writeFSWHiscores(playerName) {
    await timeout(5000);
    await getFSWHiscoresForPlayer(playerName);

        if (CONSOLIDATED_ARRAY.length > 0) {

                for (let i = 0; i < CONSOLIDATED_ARRAY.length; i++) {
                    await timeout(100);
                    try {
                        const writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET[i]);
                        const point1 = new Point('player').tag('name', playerName).floatField('level', CONSOLIDATED_ARRAY[i][3]);
                        const point2 = new Point('player').tag('name', playerName).floatField('experience', CONSOLIDATED_ARRAY[i][2]);
                        const point3 = new Point('player').tag('name', playerName).floatField('position', CONSOLIDATED_ARRAY[i][1]);

                        writeApi.writePoints([point1, point2, point3]);
                        writeApi.close().then(() => {
                            console.log(`Data has been successfully written to Influx for ${playerName} for table ${INFLUX_BUCKET[i]}`);
                        })
                    } catch (error) {
                    }
                }
        }

}

async function _write() {
    for (let j = 0; j < players.length; j++) {
        await writeFSWHiscores(players[j]);
    }
}

// await _write();
// let date = new Date();
// console.log(`Next Event Is: ${new Date(date.getTime() + players.length * 1000)}`);
// setInterval(() => async function () {
//     await _write();
//     let date = new Date();
//     console.log(`Next Event Is: ${new Date(date.getTime() + players.length * 1000)}`);
// }, 100);

while (1 === 1) {
    await timeout(5000);
    await _write();
    let date = new Date();
    console.log(`Next Event Is: ${new Date(date.getTime() + 5000)}`);
}