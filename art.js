const sharp = require('sharp');
const FileIndexReader = require('./fileindexreader');

class Art {

    constructor() {
        this.index = new FileIndexReader({
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
