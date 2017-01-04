const uodatareader = require('./index');

// load map block:
const felucca = new uodatareader.Map({
    baseDirectory: '../tmp/uo',
    mapId: 0
});

const area = felucca.getLandBlock(1, 1);
console.log(area);

// load land image as sharp image:
const art = new uodatareader.Art({
    baseDirectory: '../tmp/uo'
});
// image is type 'sharp' (https://github.com/lovell/sharp)
const image = art.loadLand(2);

image.toFile('test.png');
