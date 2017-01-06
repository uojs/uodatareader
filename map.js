const fs = require('graceful-fs');
const path = require('path');
const hash = require('uop-hash');
const FileIndexReader = require('./fileindexreader');
const pad = require('./pad');

class Map {
    constructor(options) {
        this.options = options;
        this.index = new FileIndexReader({
            baseDirectory: options.baseDirectory,
            indexFile: `map${options.mapId}.idx`,
            mulFile: `map${options.mapId}.mul`,
            uopFileExtension: 'dat'
        });
    }

    getLandBlock(x, y) {
        if (x < 0 || y < 0) {
            throw new Error (`Out of bounds: (x = ${x}, y = ${y})`);
        }

        return this.readLandBlock(x, y);
    }

    readLandBlock(x, y) {
        const blockHeight = this.height >> 3;
        let offset = ((x * blockHeight) + y) * 196 + 4;

        if (this.index.isUOP) {
            offset = this.calculateOffset(offset);
        }

        if (!this.index.reader.seek(offset)) {
            throw `could not seek to ${offset}`;
        }

        return Array(64).fill(null).map((x, index) => {
            const id = this.index.reader.nextUShort();
            const z = this.index.reader.nextSByte();

            return {
                id,
                z
            };
        });
    }

    calculateOffset(offset) {
        let pos = 0;
        const index = this.index;
        const length = index.length;
        for (var i = 0; i < length; i++) {
            let t = index.lookup(i);
            let currPos = (pos + t.length) >>> 0;

            if (offset < currPos) {
                return (t.lookup + (offset - pos)) >>> 0;
            }
            pos = currPos;
        }
        throw 'todo: return uoplength?';
    }
}

module.exports = Map;
