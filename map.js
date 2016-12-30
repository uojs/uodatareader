const fs = require('graceful-fs');
const debug = require('debug')('map');
//const hash = require('./hash');
const hash = require('uop-hash');
const pad = require('./pad');
const path = require('path');

class Map {
    constructor(fileIndex, mapId, width, height) {
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
        const filehelper = Map.filehelper;
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
        this.readUOPFiles();
        if (this.isUOP) {
        }
        //TODO: lock file; get UOP offset
        let offset = ((x * this.blockHeight) + y) * 196 + 4;
        const buffer = Buffer.alloc(192);
        const block = Array(64).fill(null);
        const fileDescriptor = this.getFileDescriptor();

        offset = this.calculateOffset(offset);
        fs.readSync(fileDescriptor, buffer, 0, buffer.length, offset);

        return block.map((x, index) => {
            const id = buffer.readUInt16LE(index * 3);
            const z = buffer.readInt8(index * 3 + 2);

            return {
                id,
                z
            };
        });
    }
    calculateOffset(offset) {
        let pos = 0;

        for (var i = 0; i < this.uopFiles.length; i++) {
            let t = this.uopFiles[i];
            let currPos = (pos + t.length) >>> 0;
            if (offset < currPos) {
                return (t.offset + (offset - pos)) >>> 0;
            }
            pos = currPos;
        }
        throw 'return uoplength';
    }
    readUOPFiles() {
        const uopFiles = [];
        const fileDescriptor = this.getFileDescriptor();
        const filehelper = Map.filehelper;
        const headerBuffer = Buffer.alloc(28);
        const basename = path.basename(this.getFullPath().toLowerCase(), '.uop');

        fs.readSync(fileDescriptor, headerBuffer, 0, headerBuffer.length, 0);

        const magicNumber = headerBuffer.readUInt32LE(0);

        if (magicNumber !== 0x50594D) {
            throw Error(`Header magic number is invalid: ${magicNumber}`);
        }
        //read8
        let nextBlock = headerBuffer.readIntLE(12, 8, true);

        //read4
        const count = headerBuffer.readUInt32LE(24);
        const hashes = {};

        for(let i = 0; i < count; i++) {
            const filename = `build/${basename}/${pad(i, 8)}.dat`;
            // this may not work due to how js uses floats, and we need a uint64_t
            const hashedFilename = hash(filename);
            const hashed = hashedFilename.join('.');
            hashes[hashed] = i;
        }

        // seek to nextBlock

        const loopBuffer = Buffer.alloc(12);
        let fileIndex = nextBlock;

        while(fs.readSync(fileDescriptor, loopBuffer, 0, loopBuffer.length, nextBlock) > 0) {
            if (nextBlock === 0) {
                break;
            }
            const filesCount = loopBuffer.readUInt32LE(0);
            let prevBlock = nextBlock;
            //nextBlock = headerBuffer.readUInt32LE(4);
            nextBlock = headerBuffer.readIntLE(4, 8, true) >>> 0;

            const fileBuffer = Buffer.alloc(34);
            for(let i = 0; i < filesCount; i++) {
                fs.readSync(fileDescriptor, fileBuffer, 0, fileBuffer.length, prevBlock + 12 + (i * fileBuffer.length));

                const offset = fileBuffer.readIntLE(0, 8, true);
                const headerLength = fileBuffer.readUInt32LE(8);
                const compressedLength = fileBuffer.readUInt32LE(12);
                const decompressedLength = fileBuffer.readUInt32LE(16);
                const hashed = [fileBuffer.readUInt32LE(24), fileBuffer.readUInt32LE(20)].join('.');
                const flag = fileBuffer.readUInt16LE(28);
                //console.log(hashed);
                uopFiles.push({
                    offset: offset + headerLength,
                    length: flag === 1 ? compressedLength : decompressedLength
                });

            }
        }

        this.uopFiles = uopFiles;
    }
}

module.exports = Map;
