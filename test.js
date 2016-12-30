const uodatareader = require('./index');

const datareader = uodatareader({
    path: '../tmp/uo/'
});

const map = new datareader.Map(0, 6144, 4096);

//map.readUOPFiles(1, 1);
console.log(
    map.readLandBlock(1, 1)
);
