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
    'ToastieFox'
]

const influxDB = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });

async function getFSWHiscoresForPlayer(playerName) {
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

            // for (let i = 0; i < positionArray.length; i++) {
            //     if (nameArray[i] === playerName) {
            //         CONSOLIDATED_ARRAY.push({
            //             position: positionArray[i],
            //             name: nameArray[i],
            //             total_level: totalLevelArray[i],
            //             total_experience: totalExperienceArray[i]
            //         });
            //         break;
            //     }
            // }

            res(`Information successfully obtained for ${playerName}}`);
        } catch (error) {
            rej({ message: `Information failed to obtain for ${playerName}}`, error });
        }
    })
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function writeFSWHiscores(table, playerName) {
    await timeout(5000);
    await getFSWHiscoresForPlayer(table, playerName);

    return new Promise((res, rej) => {
        if (CONSOLIDATED_ARRAY.length > 0) {
            try {
                const writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET[table]);
                const point1 = new Point('player').tag('name', CONSOLIDATED_ARRAY[0].name).floatField('level', CONSOLIDATED_ARRAY[0].total_level);
                const point2 = new Point('player').tag('name', CONSOLIDATED_ARRAY[0].name).floatField('experience', CONSOLIDATED_ARRAY[0].total_experience.replace(/,/g, ''));
                const point3 = new Point('player').tag('name', CONSOLIDATED_ARRAY[0].name).floatField('position', CONSOLIDATED_ARRAY[0].position);
                CONSOLIDATED_ARRAY.length = 0;

                writeApi.writePoints([point1, point2, point3]);
                writeApi.close().then(() => {
                    res(`Data has been successfully written to Influx for ${playerName} for table ${INFLUX_BUCKET[table]}`);
                })

                CONSOLIDATED_ARRAY.length = 0;
                res(`Data has been successfully written to Influx for ${playerName} for table ${INFLUX_BUCKET[table]}`);
            } catch (error) {
                CONSOLIDATED_ARRAY.length = 0;
                rej(`Data failed to be written to Influx for ${playerName} for table ${INFLUX_BUCKET[table]}`)
            }
        } else {
            rej(`Consolidated array contained no information for table ${INFLUX_BUCKET[table]} for ${playerName}`);
        }
    })

}

async function _write() {
    for (let i = 0; i < 28; i++) {
        for (let j = 0; j < players.length; j++) {
            await writeFSWHiscores(i, players[j]);
        }
    }
}


// setInterval(() => async function () {
//     await _write();
// }, players.length * 3000);