const uodatareader = require('./index');

const datareader = uodatareader({
    path: '../tmp/uo/'
});

//idxFile, mulFile, uopFile, length
const art = new datareader.FileIndexReader({
    baseDirectory: '../tmp/uo/',
    indexFile: 'art.idx',
    mulFile: 'art.mul',
    uopFileExtension: 'tga',
    length: 0x10000
});

console.log(art.lookup(3));
