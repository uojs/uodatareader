const uodatareader = require('./index');
const art = new uodatareader.Art({
    baseDirectory: '../tmp/uo'
});

const image = art.loadLand(2);

image.toFile('test.png');
