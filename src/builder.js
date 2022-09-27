import fs from 'fs';
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
            let entries = 0;

            fs.readdir(basePath, (err, dir) => {
                if (err) return;
                dir.forEach(folder => {
                    fs.readdir(`${basePath}\\${folder}`, (err, files) => {
                        if (err) return;
                        files.forEach(file => {
                            const timestamp = file.slice(file.lastIndexOf('_') + 1).replace(/\.csv/g, '');
                            if (currentTimestamp - 86400000 - parseInt(timestamp) > 0) return;
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
                                        experience: miniArr[4]
                                    }
                                }

                                for (let i = 0; i < arr.length; i++) {
                                    masterArr.push(generateObj(`${folder},${timestamp},${arr[i]}`.split(',')));
                                }
                            })
                        });
                    })
                });
            });

            let wait = setInterval(() => {
                if (masterArr.length >= entries) {
                    res(masterArr);
                    clearInterval(wait);
                }
            }, 1000);
        } catch (error) {
            rej(err);
        }
    })
}

export async function writeToJson(currentTimestamp) {
    const array = await build(currentTimestamp);
    const writeTimestamp = Date.now();
    if (!fs.existsSync(`${basePath}\\data`)) {
        fs.mkdirSync(`${basePath}\\data`);
    }
    fs.writeFile(`${basePath}\\data\\influxdb_${writeTimestamp}.json`, JSON.stringify(array), () => {
        console.log(`${basePath}\\data\\influxdb_${writeTimestamp}.json has been created`)
    })
}