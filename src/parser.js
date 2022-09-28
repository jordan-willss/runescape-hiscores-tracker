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

export async function writeFSWHiscores(table, pageCount = 1) {
    return new Promise(async res => {
        try {
            let consolidatedArray = [];

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
                consolidatedArray = [...consolidatedArray, ...result];
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

            consolidatedArray.forEach(value => {
                csv += `${value?.position},${value?.name},${value?.total_level},${value?.total_experience}\n`;
            })

            if (consolidatedArray.length > 0) fs.writeFileSync(`${outputPath}\\out\\${tableNames[table]}\\${tableNames[table]}_${Date.now()}.csv`, csv);

            res(`Successfully generated file for ${tableNames[table]} @ ${new Date()}`);
        } catch (error) {
            res(`Failed to generate file for ${tableNames[table]} @ ${new Date()}`);
        }
    })
}

for (let i = 0; i <= 28; i++) {
    await writeFSWHiscores(i, 4);
}