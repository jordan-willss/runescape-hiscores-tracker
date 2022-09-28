import fs, { write } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = `${__dirname.slice(0, __dirname.lastIndexOf("\\"))}\\out`;

// https://docs.influxdata.com/telegraf/v1.14/data_formats/input/json/

async function build(currentTimestamp) {
    return new Promise((res, rej) => {
        try {
            const masterArr = []
            let masterStr = "";
            let entries = 0;

            fs.readdir(basePath, (err, dir) => {
                if (err) return;
                dir.forEach(folder => {
                    fs.readdir(`${basePath}\\${folder}`, (err, files) => {
                        if (err) return;
                        files.forEach(file => {
                            if (!file.match(/[\s\S]*.csv/g)) return;
                            const timestamp = file.slice(file.lastIndexOf('_') + 1).replace(/\.csv/g, '');
                            // Removing for now just to build everything
                            // if (currentTimestamp - 86400000 - parseInt(timestamp) > 0) return;
                            fs.readFile(`${basePath}\\${folder}\\${file}`, 'utf8', (err, contents) => {
                                if (err) return;

                                const arr = contents.split('\n').slice(0, -1);

                                entries += arr.length;

                                const generateObj = (miniArr) => {
                                    return {
                                        skill: miniArr[0],
                                        timestamp: miniArr[1],
                                        rank: miniArr[2],
                                        name: miniArr[3],
                                        level: miniArr[4],
                                        experience: miniArr[5]
                                    }
                                }

                                const generateLine = (miniArr) => {
                                    return `${miniArr[0]},rank=${miniArr[2]},level=${miniArr[4]},experience=${miniArr[5]} name="${miniArr[3]}" ${miniArr[1]}000000\n`;
                                }

                                for (let i = 0; i < arr.length; i++) {
                                    const miniArr = `${folder},${timestamp},${arr[i]}`.split(',');
                                    masterArr.push(generateObj(miniArr));
                                    masterStr += generateLine(miniArr);
                                }
                            })
                        });
                    })
                });
            });

            let wait = setInterval(() => {
                console.log(`Build progress: ${entries / masterArr.length * 100}%`)
                if (masterArr.length >= entries) {
                    res([masterArr, masterStr.slice(0, -2)]);
                    clearInterval(wait);
                }
            }, 100);
        } catch (error) {
            rej(err);
        }
    })
}

export async function writeToJson(currentTimestamp) {
    const response = await build(currentTimestamp);
    const array = response[0];
    const writeTimestamp = Date.now();
    if (!fs.existsSync(`${basePath}\\data`)) {
        fs.mkdirSync(`${basePath}\\data`);
    }
    fs.writeFile(`${basePath}\\data\\influxdb_${writeTimestamp}.json`, JSON.stringify(array), () => {
        console.log(`${basePath}\\data\\influxdb_${writeTimestamp}.json has been created`)
    })
}

export async function writeToLines(currentTimestamp) {
    const response = await build(currentTimestamp);
    const lines = response[1];
    const writeTimestamp = Date.now();
    if (!fs.existsSync(`${basePath}\\data`)) {
        fs.mkdirSync(`${basePath}\\data`);
    }
    fs.writeFile(`${basePath}\\data\\influxdb_${writeTimestamp}.line`, lines, () => {
        console.log(`${basePath}\\data\\influxdb_${writeTimestamp}.line has been created`)
    })
}

await writeToJson(Date.now());
await writeToLines(Date.now());