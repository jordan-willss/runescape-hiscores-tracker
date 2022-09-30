import fetch from 'node-fetch';
import {InfluxDB, Point} from '@influxdata/influxdb-client'
import {write} from "fs";


const consolidatedArray = []

let fixedTime;

var minutes = 0.1, intveral = minutes * 60 * 1000;

const INFLUX_URL='http://192.168.0.23:8086/';
const INFLUX_TOKEN='iCi9NAG_KNN5xEneM4LCH_c8vj5lIeT1db00joqix9KfUZ3He_16d7LSN4i3o6oG88qwxNYOnK2ASsk2oqoxSQ==';
const INFLUX_ORG='0d5dfe51898d0c79';
const INFLUX_BUCKET= [
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
    } catch(err) {

    }
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function writeFSWHiscores(table, playerName) {
    await timeout(5000);
    await getFSWHiscoresForPlayer(table, playerName);

    if (consolidatedArray.length > 0) {

        let writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET[table]);
        let point1 = new Point('player').tag('name', consolidatedArray[0].name).floatField('level', consolidatedArray[0].total_level);
        let point2 = new Point('player').tag('name', consolidatedArray[0].name).floatField('experience', consolidatedArray[0].total_experience.replace(/,/g, ''));
        let point3 = new Point('player').tag('name', consolidatedArray[0].name).floatField('position', consolidatedArray[0].position);

        writeApi.writePoints([point1, point2, point3]);
        writeApi.close().then(() => {
            console.log(`${playerName} - ${INFLUX_BUCKET[table]}`);
        })

        consolidatedArray.length = 0;
    }
}

async function _write() {
    fixedTime = Date.now();


    for(let i = 0; i < 28; i++) {
        for (let j = 0; j < players.length; j++) {
            await writeFSWHiscores(i, players[j]);
        }
    }

}


await _write();

setInterval(() => async function(){
        await _write();
    }, players.length * 3000);