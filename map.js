const fs = require('graceful-fs');
const path = require('path');
const hash = require('uop-hash');
const debug = require('debug')('map');

const pad = require('./pad');

class Map {
    constructor(fileIndex, width, height) {
        this.fileIndex = fileIndex;
        this.width = width;
        this.height = height;
        this.isUOP = false;
        this.uopFiles = null;
        this.fileDescriptor = null;

        this.path = this.getFullPath();

        if (this.path === null) {
            throw new Error('file path is null');
        }
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
            throw new Error (`Out of bounds: (x = ${x}, y = ${y})`);
        }

        return this.readLandBlock(x, y);
    }

    readLandBlock(x, y) {
        const blockHeight = this.height >> 3;
        let offset = ((x * blockHeight) + y) * 196 + 4;

        if (this.isUOP) {
            if (this.uopFiles === null) {
                this.readUOPFiles();
            }
            offset = this.calculateOffset(offset);
        }
        //TODO: lock file; get UOP offset
        const buffer = Buffer.alloc(192);
        const block = Array(64).fill(null);
        const fileDescriptor = this.getFileDescriptor();

        fs.readSync(fileDescriptor, buffer, 0, buffer.length, offset);

        return block.map((x, index) => {
            const offset = index * 3;
            const id = buffer.readUInt16LE(offset);
            const z = buffer.readInt8(offset + 2);

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
            const hashed = hash(filename).join('.');
            hashes[hashed] = i;
        }

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
