import fetch from 'node-fetch';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import * as jsdom from "jsdom";



const CONSOLIDATED_ARRAY = []

const INFLUX_URL = 'http://192.168.0.23:8086/';
const INFLUX_TOKEN = 'iCi9NAG_KNN5xEneM4LCH_c8vj5lIeT1db00joqix9KfUZ3He_16d7LSN4i3o6oG88qwxNYOnK2ASsk2oqoxSQ==';
const INFLUX_ORG = '0d5dfe51898d0c79';
const INFLUX_BUCKET = [
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
    'archaeology',
    'overall',
    'questPoints'
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
            let response = await fetch(`https://apps.runescape.com/runemetrics/profile?user=${encodeURIComponent(playerName)}`)
                .then(res => res.text())
                .then(data => data);

            let player = JSON.parse(response);

            let skills = [];
            let overallLevel = 0;
            let overallXp = 0;
            let overallId = INFLUX_BUCKET.length - 2;

            player.skillvalues.forEach((skill) => {
                skills.push(skill);
            });


            skills.forEach((skill) => {
                skill.xp = Math.floor(skill.xp / 10);

                overallLevel += skill.level;
                overallXp += skill.xp;

                CONSOLIDATED_ARRAY.push(skill);
            })

            CONSOLIDATED_ARRAY.push({
                level: overallLevel,
                xp: overallXp,
                id: overallId
            });

            response = await fetch(`https://apps.runescape.com/runemetrics/quests?user=${encodeURIComponent(playerName)}`)
                .then(res => res.text())
                .then(data => data);

            let questPoints = 0;

            let quests = JSON.parse(response).quests;

            quests.forEach((quest) => {
                if (quest.status === 'COMPLETED') {
                    questPoints += quest.questPoints;
                }
            });

            CONSOLIDATED_ARRAY.push({
                questPoints: questPoints,
                id: INFLUX_BUCKET.length - 1
            });

            console.log(questPoints)


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
    await getFSWHiscoresForPlayer(playerName);

    if (CONSOLIDATED_ARRAY.length > 0) {

        for (let i = 0; i < CONSOLIDATED_ARRAY.length - 1; i++) {
            await timeout(10);
            try {
                let skill = CONSOLIDATED_ARRAY[i];

                const writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET[skill.id]);
                const point1 = new Point('player').tag('name', playerName).floatField('level', skill.level);
                const point2 = new Point('player').tag('name', playerName).floatField('experience', skill.xp);

                writeApi.writePoints([point1, point2]);
                writeApi.close().then(() => {
                    console.log(`Data has been successfully written to Influx for ${playerName} for table ${INFLUX_BUCKET[skill.id]}`);
                })
            } catch (error) {
            }
        }

        try {
            let skill = CONSOLIDATED_ARRAY[CONSOLIDATED_ARRAY.length - 1];

            const writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET[skill.id]);
            const point1 = new Point('player').tag('name', playerName).floatField('questPoints', skill.questPoints);

            writeApi.writePoints([point1]);
            writeApi.close().then(() => {
                console.log(`Data has been successfully written to Influx for ${playerName} for table ${INFLUX_BUCKET[skill.id]}`);
            })
        } catch (error) {
        }

    }

}

async function _write() {
    for (let j = 0; j < players.length; j++) {
        await writeFSWHiscores(players[j]);
    }
}

while (1 === 1) {
    await timeout(5000);
    await _write();
}

// await getFSWHiscoresForPlayer('FSW GammaS')