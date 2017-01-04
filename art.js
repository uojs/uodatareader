const sharp = require('sharp');
const FileIndexReader = require('./fileindexreader');

class Art {

    constructor(options) {
        this.index = new FileIndexReader({
            baseDirectory: options.baseDirectory,
            indexFile: 'art.idx',
            mulFile: 'art.mul',
            uopFileExtension: 'tga',
            length: 0x10000
        });

    }

    loadStatic(id) {

    }


}

module.exports = Art;
