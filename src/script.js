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

const consolidatedArray = []

let fixedTime;

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
    const response = await fetch(`https://secure.runescape.com/m=hiscore_seasonal/c=EQL69q8CNr8/ranking?category_type=0&table=${table}&time_filter=0&date=${Date.now()}&page=${page}`).then(res => res.text());

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
            consolidatedArray.push({
                position: positionArray[i],
                name: nameArray[i],
                total_level: totalLevelArray[i],
                total_experience: totalExperienceArray[i]
            })
        }
    } catch(err) {
        console.log(err);
    }
}

async function writeFSWHiscores(table, count = 1) {
    for (let i = 1; i <= count; i++) {
        await getFSWHiscores(table, i);
    }

    if (consolidatedArray.length === 0) return;
    
    let csv = "";
    
    consolidatedArray.forEach(value => {
        csv += `${value?.position},${value?.name},${value?.total_level},${value?.total_experience.replace(/,/g, '')}\n`;
    })
    
    fs.writeFileSync(`${outputPath}\\out\\${tableNames[table]}\\${tableNames[table]}_${fixedTime}.csv`, csv);

    consolidatedArray.length = 0;
}

async function _write(count) {
    fixedTime = Date.now();

    tableNames.forEach(value => {
        if (!fs.existsSync(`${outputPath}\\out`)){
            fs.mkdirSync(`${outputPath}\\out`);
        }
    
        if (!fs.existsSync(`${outputPath}\\out\\${value}`)){
            fs.mkdirSync(`${outputPath}\\out\\${value}`);
        }
    })

    for(let i = 0; i < 28; i++) {
        await writeFSWHiscores(i, count);
    }
}

await _write(4);