import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = __dirname.slice(0, __dirname.lastIndexOf("\\"));

// Edit this to change the output of the files
// By default it is the root of the project (__dirname)
const outputPath = basePath;

const tableNames = [
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
]

async function getFSWHiscores(table, page) {
    const response = await fetch(`https://secure.runescape.com/m=hiscore_seasonal/ranking?category_type=0&table=${table}&time_filter=0&date=${Date.now()}&page=${page}`).then(res => res.text()).then(data => data);

    try {
        const pageArray = []

        for (let i = 1; i <= 25; i++) {
            pageArray.push({
                position: "",
                name: "",
                total_level: "",
                total_experience: ""
            })
        }

        String(response).replace(/\n/gm, '').match(/<td class="col1([\S\s]*?)<\/td>/gm).forEach((entry, index) => pageArray[index].position = entry.match(/(?<=<a[\s\S]*?>)[\s\S]*?(?=<\/a>)/g)[0].replace(/,/g, ''));
        String(response).replace(/\n/gm, '').match(/<td class="col2([\S\s]*?)<\/td>/gm).forEach((entry, index) => pageArray[index].name = entry.match(/(?<=<img[\s\S]*?\/>)[\s\S]*?(?=<\/a>)/g)[0].replace(/,/g, ''));
        String(response).replace(/\n/gm, '').match(/<td class="col3([\S\s]*?)<\/td>/gm).forEach((entry, index) => pageArray[index].total_level = entry.match(/(?<=<a[\s\S]*?>)[\s\S]*?(?=<\/a>)/g)[0].replace(/,/g, ''));
        String(response).replace(/\n/gm, '').match(/<td class="col4([\S\s]*?)<\/td>/gm).forEach((entry, index) => pageArray[index].total_experience = entry.match(/(?<=<a[\s\S]*?>)[\s\S]*?(?=<\/a>)/g)[0].replace(/,/g, ''));

        return pageArray;
    } catch (error) {
        return [];
    }
}

async function getFSWHiscoresByName(table, player) {
    const response = await fetch(`https://secure.runescape.com/m=hiscore_seasonal/ranking?category_type=0&table=${table}&time_filter=0&date=${Date.now()}&user=${player.replace(/ /g, '+')}`).then(res => res.text()).then(data => data);
    try {
        if (String(response).match(/was not found in the [a-zA-Z]*? table/gm)) return [];

        const pageArray = []

        for (let i = 1; i <= 25; i++) {
            pageArray.push({
                position: "",
                name: "",
                total_level: "",
                total_experience: ""
            })
        }

        String(response).replace(/\n/gm, '').match(/<td class="col1([\S\s]*?)<\/td>/gm).forEach((entry, index) => pageArray[index].position = entry.match(/(?<=<a[\s\S]*?>)[\s\S]*?(?=<\/a>)/g)[0].replace(/,/g, ''));
        String(response).replace(/\n/gm, '').match(/<td class="col2([\S\s]*?)<\/td>/gm).forEach((entry, index) => pageArray[index].name = entry.match(/(?<=<img[\s\S]*?\/>)[\s\S]*?(?=<\/a>)/g)[0].replace(/,/g, ''));
        String(response).replace(/\n/gm, '').match(/<td class="col3([\S\s]*?)<\/td>/gm).forEach((entry, index) => pageArray[index].total_level = entry.match(/(?<=<a[\s\S]*?>)[\s\S]*?(?=<\/a>)/g)[0].replace(/,/g, ''));
        String(response).replace(/\n/gm, '').match(/<td class="col4([\S\s]*?)<\/td>/gm).forEach((entry, index) => pageArray[index].total_experience = entry.match(/(?<=<a[\s\S]*?>)[\s\S]*?(?=<\/a>)/g)[0].replace(/,/g, ''));

        return pageArray;
    } catch (error) {
        return [];
    }
}

export async function writeFSWHiscores(table, pageCount = 1) {
    return new Promise(async res => {
        try {
            let CONSOLIDATED_ARRAY = [];

            tableNames.forEach(value => {
                if (!fs.existsSync(`${outputPath}\\out`)) {
                    fs.mkdirSync(`${outputPath}\\out`);
                }

                if (!fs.existsSync(`${outputPath}\\out\\${value}`)) {
                    fs.mkdirSync(`${outputPath}\\out\\${value}`);
                }
            })

            let i = 1;
            let offset = 0;

            delayLoop(async () => {
                const result = await getFSWHiscores(table, i + offset);
                if (result.pop()?.total_level === 99 && result[0]?.total_level < 200) i--; offset++;
                CONSOLIDATED_ARRAY = [...CONSOLIDATED_ARRAY, ...result];
            }, pageCount, 5000);

            function delayLoop(fn = Function, count = 1, timeout = 5000) {
                setTimeout(async () => {
                    if (i <= count) {
                        fn();
                        i++;
                        delayLoop(fn, count, timeout);
                    } else {
                        i = 0;
                    }
                }, timeout)
            }

            let csv = "";

            CONSOLIDATED_ARRAY.forEach(value => {
                csv += `${value?.position},${value?.name},${value?.total_level},${value?.total_experience}\n`;
            })

            if (CONSOLIDATED_ARRAY.length > 0) fs.writeFileSync(`${outputPath}\\out\\${tableNames[table]}\\${tableNames[table]}_${Date.now()}.csv`, csv);

            res(`Successfully generated file for ${tableNames[table]} @ ${new Date()}`);
        } catch (error) {
            res(`Failed to generate file for ${tableNames[table]} @ ${new Date()}`);
        }
    })
}

export async function writeFSWHiscoresByName(player) {
    return new Promise(async res => {
        try {
            if (!fs.existsSync(`${outputPath}\\out`)) {
                fs.mkdirSync(`${outputPath}\\out`);
            }

            if (!fs.existsSync(`${outputPath}\\out\\${player.replace(/ /g, '_')}`)) {
                fs.mkdirSync(`${outputPath}\\out\\${player.replace(/ /g, '_')}`);
            }

            let csv = "";
            let i = 0;

            delayLoop(async () => {
                const result = await getFSWHiscoresByName(i, player);
                result.forEach(entry => {
                    if (entry?.name === player) {
                        csv += `${entry?.position},${entry?.name},${entry?.total_level},${entry?.total_experience}\n`;
                    }
                })
            }, 28, 5000);

            function delayLoop(fn = Function, count = 1, timeout = 5000) {
                setTimeout(async () => {
                    if (i <= count) {
                        fn();
                        i++;
                        delayLoop(fn, count, timeout);
                    }
                }, timeout)
            }

            let fsWrite = setInterval(() => {
                if (i >= 28) {
                    fs.writeFileSync(`${outputPath}\\out\\${player.replace(/ /g, '_')}\\${player.replace(/ /g, '+')}_${Date.now()}.csv`, csv);
                    clearInterval(fsWrite);
                    res(`Successfully generated file for ${player} @ ${new Date()}`);
                }
            }, 100)
        } catch (error) {
            res(`Failed to generate file for ${player} @ ${new Date()}`);
        }
    })
}

// for (let i = 0; i <= 28; i++) {
//     await writeFSWHiscores(i, 4);
// }

const response1 = await writeFSWHiscoresByName("fsw dendofy");
const response2 = await writeFSWHiscoresByName("FSW GammaS");
const response3 = await writeFSWHiscoresByName("FSWCardinal");

console.log(response1);
console.log(response2);
console.log(response3);