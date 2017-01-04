const uodatareader = require('./index');

const map = new uodatareader.Map({
    mapId: 0,
    baseDirectory: '../tmp/uo/',
    indexFile: 'art.idx',
    mulFile: 'art.mul',
    uopFileExtension: 'tga'
});
//console.log(idx.lookup(1));

console.log(
    map.getLandBlock(2, 2)
);
