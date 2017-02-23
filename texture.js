const sharp = require('sharp');
const FileIndexReader = require('./fileindexreader');
const fs = require('graceful-fs');
const colors = require('./colors');
const ColorConverter = colors.ColorConverter;

class Texture {

    constructor(options) {
        this.index = new FileIndexReader({
            baseDirectory: options.baseDirectory,
            indexFile: 'texidx.mul',
            mulFile: 'texmaps.mul',
            length: 0x4000,
            hasExtra: true
        });

    }

    loadTexture(id) {
        let item = this.index.lookup(id);
        if (!item.lookup && !item.length) {
            // revert to the "no draw" texture:
            item = this.index.lookup(2);
        }
        const reader = this.index.getMulReader();
        const size = item.extra === 0 ? 64 : 128;
        const readBuffer = Buffer.alloc(item.length);
        const writeBuffer = Buffer.alloc(size * size * 4);
        const fd = reader.fileDescriptor;
        fs.readSync(fd, readBuffer, 0, readBuffer.length, item.lookup);

        for(var i = 0; i < size * size; i++) {
            const value = readBuffer.readInt16LE(i * 2);
            const colorBuffer = ColorConverter.From1555To8888(value | 0x8000);

            colorBuffer.copy(writeBuffer, i * 4);
        }

        return sharp(writeBuffer, {
            raw: {
                height: size,
                width: size,
                channels: 4
            }
        });
    }
}

module.exports = Texture;
