const uodatareader = require('./index')({baseDirectory: '../tmp/uo/', maps: [{id: 0}, {id: 1}]});
// load map block:
const felucca = uodatareader.maps[0];
//console.log(felucca);
const area = felucca.getLandBlock(500, 500);
console.log(area);

// load land image as sharp image:
/*const art = new uodatareader.Art({
    baseDirectory: '../tmp/uo'
});
// image is type 'sharp' (https://github.com/lovell/sharp)
const image = art.loadLand(2);

image.toFile('test.png');
*/
