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

export {INFLUX_URL, INFLUX_ORG, INFLUX_TOKEN, INFLUX_BUCKET};