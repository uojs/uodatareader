const uodatareader = require('./index')({
    baseDirectory: './uo',
    maps: [{id: 0}, {id: 1}]
});

// load map block:
const felucca = uodatareader.maps[0];

felucca.getLandBlock(472, 314)
felucca.getLandBlock(473, 314)
felucca.getLandBlock(474, 314)
felucca.getLandBlock(472, 315)
felucca.getLandBlock(473, 315)
felucca.getLandBlock(474, 315)
felucca.getLandBlock(472, 316)
felucca.getLandBlock(473, 316)
felucca.getLandBlock(474, 316)

const area = felucca.getLandBlock(472, 315);
const my = felucca.readMyMethod(3787, 2523, 10);

// for(let i in my) {
//     console.log('y %d, lenght %d', i, my[i].length)
// }
console.log('ME', JSON.stringify(my));
// console.log('REAL', JSON.stringify([{"ID":209,"Z":0},{"ID":6,"Z":0},{"ID":5,"Z":0},{"ID":5,"Z":0},{"ID":4,"Z":0},{"ID":138,"Z":0},{"ID":119,"Z":0},{"ID":1017,"Z":0},{"ID":203,"Z":0},{"ID":3,"Z":0},{"ID":211,"Z":0},{"ID":219,"Z":0},{"ID":4,"Z":0},{"ID":137,"Z":0},{"ID":120,"Z":0},{"ID":1024,"Z":0},{"ID":214,"Z":0},{"ID":209,"Z":0},{"ID":196,"Z":0},{"ID":203,"Z":0},{"ID":3,"Z":0},{"ID":137,"Z":0},{"ID":120,"Z":0},{"ID":1024,"Z":0},{"ID":215,"Z":0},{"ID":199,"Z":0},{"ID":199,"Z":0},{"ID":214,"Z":0},{"ID":219,"Z":0},{"ID":137,"Z":0},{"ID":118,"Z":0},{"ID":1024,"Z":0},{"ID":5,"Z":0},{"ID":215,"Z":0},{"ID":199,"Z":0},{"ID":196,"Z":0},{"ID":204,"Z":0},{"ID":138,"Z":0},{"ID":118,"Z":0},{"ID":1024,"Z":0},{"ID":4,"Z":0},{"ID":3,"Z":0},{"ID":206,"Z":0},{"ID":196,"Z":0},{"ID":203,"Z":0},{"ID":138,"Z":0},{"ID":117,"Z":0},{"ID":1024,"Z":0},{"ID":4,"Z":0},{"ID":6,"Z":0},{"ID":202,"Z":0},{"ID":201,"Z":0},{"ID":216,"Z":0},{"ID":138,"Z":0},{"ID":114,"Z":0},{"ID":1024,"Z":0},{"ID":6,"Z":0},{"ID":6,"Z":0},{"ID":3,"Z":0},{"ID":217,"Z":0},{"ID":210,"Z":0},{"ID":138,"Z":0},{"ID":117,"Z":0},{"ID":1024,"Z":0}]))

/*
// load land image as sharp image:
const art = new uodatareader.Art({
    baseDirectory: '../tmp/uo'
});
// image is type 'sharp' (https://github.com/lovell/sharp)
const image = art.loadLand(2);

image.toFile('test.png');
*/
