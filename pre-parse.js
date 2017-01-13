const { writeFileSync } = require('fs');
/*const uodatareader = require('./index')({
    baseDirectory: './uo',
    maps: [{id: 0}, {id: 1}]
});

// load map block:
const felucca = uodatareader.maps[0];*/

const size = {
    x : 768,
    y : 512
};

const map = [];

// 472, 315
for(let currentY = 0; currentY < size.y; currentY++) {
    for(let currentX = 0; currentX < size.x; currentX++) {
        const uodatareader = require('./index')({
            baseDirectory: './uo',
            maps: [{id: 0}]
        });

// load map block:
        const felucca = uodatareader.maps[0];

        const block = felucca.getLandBlock(currentX, currentY);

        for(let i in block) {
            const y = ~~(i / 8);
            const x = i % 8;

            if(!map[y]) {
                map.push([]);
            }

            if(!block[i].id) {
                console.log('ERROR', currentX, currentY, x, y, i, block[i]);
            }
            map[y].push(block[i]);
            console.log((currentY * 8) + y, (currentX * 8) + x);

        }
    }
}

writeFileSync('result.json', JSON.stringify(map));
console.log(map.length, JSON.stringify(map));
// const area = felucca.getLandBlock(9, 0);
// console.log(area);
// const my = felucca.readMyMethod(3787, 2523, 4);

// for(let i in my) {
//     console.log('y %d, lenght %d', i, my[i].length)
// }
// console.log('ME', my);
// console.log('ME', JSON.stringify(my));
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
