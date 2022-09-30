import fetch from 'node-fetch';
import {InfluxDB, Point} from '@influxdata/influxdb-client'


const consolidatedArray = []

let fixedTime;

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

const influxDB = new InfluxDB({url: INFLUX_URL, token: INFLUX_TOKEN});

async function getFSWHiscoresForPlayer(table, playerName) {
    const response = await fetch(`https://secure.runescape.com/m=hiscore_seasonal/ranking?table=${table}&category_type=0&time_filter=0&date=1664536273844&user=${encodeURIComponent(playerName)}`).then(res => res.text());

    const positionArray = []
    const nameArray = []
    const totalLevelArray = []
    const totalExperienceArray = []

    try {
        String(response).replace(/\n/gm, '').match(/<td class="col1([\S\s]*?)<\/td>/gm).forEach(entry => positionArray.push(entry.match(/(?<=<a[\s\S]*?>)[\s\S]*?(?=<\/a>)/g)[0]));
        String(response).replace(/\n/gm, '').match(/<td class="col2([\S\s]*?)<\/td>/gm).forEach(entry => nameArray.push(entry.match(/(?<=<img[\s\S]*?\/>)[\s\S]*?(?=<\/a>)/g)[0]));
        String(response).replace(/\n/gm, '').match(/<td class="col3([\S\s]*?)<\/td>/gm).forEach(entry => totalLevelArray.push(entry.match(/(?<=<a[\s\S]*?>)[\s\S]*?(?=<\/a>)/g)[0]));
        String(response).replace(/\n/gm, '').match(/<td class="col4([\S\s]*?)<\/td>/gm).forEach(entry => totalExperienceArray.push(entry.match(/(?<=<a[\s\S]*?>)[\s\S]*?(?=<\/a>)/g)[0]));

        for (let i = 0; i < positionArray.length; i++) {
            if (nameArray[i] === playerName) {
                consolidatedArray.push({
                    position: positionArray[i],
                    name: nameArray[i],
                    total_level: totalLevelArray[i],
                    total_experience: totalExperienceArray[i]
                });
                break;
            }
        }
    } catch (err) {

    }
}

async function writeFSWHiscores(table, playerName) {
    await getFSWHiscoresForPlayer(table, playerName);

    if (consolidatedArray.length > 0) {

        let writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET[table]);
        let point1 = new Point('player').tag('name', consolidatedArray[0].name).floatField('level', consolidatedArray[0].total_level);
        let point2 = new Point('player').tag('name', consolidatedArray[0].name).floatField('experience', consolidatedArray[0].total_experience.replace(/,/g, ''));
        let point3 = new Point('player').tag('name', consolidatedArray[0].name).floatField('position', consolidatedArray[0].position);

        writeApi.writePoints([point1, point2, point3]);
        writeApi.close().then(() => {
            console.log('WRITE FINISHED');
        })

        consolidatedArray.length = 0;
    }
}

async function _write() {
    fixedTime = Date.now();

    let i = 0;
    let j = 0;
    delayLoop(async () => {
        delayLoop2(async () => {
            await writeFSWHiscores(i, players[j]);
        }, players.length, 3000);
    }, 28, 3000 * players.length);

    function delayLoop(fn = Function, count = 1, timeout = 5000) {
        setTimeout(async () => {
            if (i <= count) {
                fn();
                i++;
                delayLoop(fn, count, timeout);
            }
        }, timeout)
    }

    function delayLoop2(fn = Function, count = 1, timeout = 5000) {
        setTimeout(async () => {
            if (j <= count) {
                fn();
                j++;
                delayLoop2(fn, count, timeout);
            }
        }, timeout)
    }
}


setInterval(async () => {
    await _write();
}, 3000);