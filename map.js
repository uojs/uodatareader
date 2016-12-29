const fs = require('graceful-fs');
const debug = require('debug')('map');

class Map {
    constructor(filehelper, fileIndex, mapId, width, height) {
        this.filehelper = filehelper;
        this.path = null;
        this.fileIndex = fileIndex;
        this.mapId = mapId;
        this.width = width;
        this.height = height;
        this.blockWidth = width >> 3;
        this.blockHeight = height >> 3;
        this.isUOP = false;
        this.fileDescriptor = null;
    }
    getFileDescriptor() {
        if (this.fileDescriptor) {
            return this.fileDescriptor;
        }

        this.fileDescriptor = fs.openSync(this.getFullPath(), 'r');

        return this.fileDescriptor;
    }
    getFullPath() {
        if (this.path) {
            return this.path;
        }
        const filehelper = this.filehelper;
        let newPath = filehelper.getFilePath(`map${this.fileIndex}.mul`);
        if (fs.existsSync(newPath)) {
            this.path = newPath;
            this.isUOP = false;

            return this.path;
        }

        newPath = filehelper.getFilePath(`map${this.fileIndex}LegacyMUL.uop`);
        if (fs.existsSync(newPath)) {
            this.path = newPath;
            this.isUOP = true;

            return this.path;
        }

        return null;
    }

    getLandBlock(x, y) {
        if (x < 0 || y < 0 || x >= this.blockWidth || y >= this.blockHeight) {
            debug(`Out of bounds: (x = ${x}, y = ${y})`);
            return [];
        }

        return this.readLandBlock(x, y);
    }

    readLandBlock(x, y) {
        //TODO: lock file; get UOP offset
        const offset = ((x * this.blockHeight) + y) * 196 + 4;
        const buffer = new UInt8Array(192);
        const block = Array(64).fill(null);
        fs.readSync(this.fileDescriptor, buffer, 0, buffer.length, offset);

        return block.map((x, index) => {
            const id = (buffer[index] << 8) | buffer[index + 1];
            const z = buffer[index + 2];

            return {
                id,
                z
            };
        });
    }

}

module.exports = Map;
