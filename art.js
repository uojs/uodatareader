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

    loadLand(id) {
        const item = this.index.lookup(id);
        const reader = this.index.reader;
        const readBuffer = Buffer.alloc(item.length);
        // let's use rgba8888:
        const writeBuffer = Buffer.alloc(44 * 44 * 4);

        const fd = reader.fileDescriptor;
        fs.readSync(fd, readBuffer, 0, readBuffer.length, item.lookup);

        let xOffset = 21;
        let xWidth = 2;
        let i = 0;

        // build the top half of the triangle:
        for (let y = 0; y < 22; ++y, --xOffset, xWidth += 2) {
            for(let x = xOffset; x < xWidth + xOffset; x++, i += 2) {
                const value = readBuffer.readInt16LE(i) | 0x8000; // force alpha=1
                const colorBuffer = ColorConverter.From1555To8888(value);
                const writeOffset = 4 /* bytes per pixel */ * (x + y * 44);
                colorBuffer.copy(writeBuffer, writeOffset);
            }
        }

        // build the bottom half of the triangle:
        xOffset = 0;
        xWidth = 44;
        for (let y = 0; y < 22; ++y, ++xOffset, xWidth -= 2) {
            for(let x = xOffset; x < xWidth + xOffset; x++, i += 2) {
                const value = readBuffer.readInt16LE(i) | 0x8000; // force alpha=1
                const colorBuffer = ColorConverter.From1555To8888(value);
                const writeOffset = 4 /* bytes per pixel */ * (x + y * 44) + 44 * 22 * 4;
                colorBuffer.copy(writeBuffer, writeOffset);
            }
        }

        return sharp(writeBuffer, {
            raw: {
                height: 44,
                width: 44,
                channels: 4
            }
        });
    }
}

module.exports = Art;
