const uodatareader = require('./index')({
    baseDirectory: './uo/',
    cache : './uo-cache',
    maps: [{
        fileIndex   : 0,
        mapId       : 0,
        width       : 6144,
        height      : 4096
    },
        //{id: 1, width: 6144, height: 4096}
    ]
});
// load map block:
const felucca = uodatareader.maps[0];

//console.log(felucca.getLandBlock2(1, 1));
// console.log(felucca.getLandBlock(183, 205));
console.time('One');
// console.log(JSON.stringify(felucca.readMyMethod(3787, 2523, 20)));
console.timeEnd('One');

console.time('Two');
// felucca.readMyMethod(3700, 2500, 30);
console.timeEnd('Two');
//console.log(felucca);
//const area = felucca.getLandBlock(500, 500);
//console.log(area);

// load land image as sharp image:
/*const art = new uodatareader.Art({
    baseDirectory: '../tmp/uo'
});
// image is type 'sharp' (https://github.com/lovell/sharp)
const image = art.loadLand(2);

image.toFile('test.png');
*/
