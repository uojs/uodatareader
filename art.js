const sharp = require('sharp');
const FileIndexReader = require('./fileindexreader');
const fs = require('graceful-fs');
const colors = require('./colors');
const ColorConverter = colors.ColorConverter;

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
        const item = this.index.lookup(id);
        const reader = this.index.reader;
        const readBuffer = Buffer.alloc(item.length);
        // let's use rgba8888:
        const writeBuffer = Buffer.alloc(44 * 44 * 4);

        const fd = reader.fileDescriptor;
        fs.readSync(fd, readBuffer, 0, readBuffer.length, item.lookup);

        let xOffset = 21;
        let xRun = 2;
        let i = 0;
        for (let y = 0; y < 22; y++, xOffset--, xRun++) {
            //From1555To8888
            for(let x = xOffset; x < xRun; x++) {
                const value = readBuffer.readInt16LE(i++) | 0x8000; // force alpha=1
                const colorParts = ColorConverter.From1555To8888(value);
                const writeOffset = 4 * (x + y * 44);
                //writeBuffer[writeOffset]
                colorParts.copy(writeBuffer, writeOffset);
            }
            //
        }

        const image = sharp(writeBuffer, {
            raw: {
                height: 44,
                width: 44,
                channels: 4
            }
        });
        image.toFile('blah.png');
    }
}

module.exports = Art;
