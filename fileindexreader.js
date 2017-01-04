const fs = require('graceful-fs');
const path = require('path');
const hash = require('uop-hash');
const BinReader = require('binreader');

const pad = require('./pad');

class FileIndexReader {
    constructor(options) {
        this.options = options;
        this.index = this.readIndex();
    }

    getReader() {
        if (this.reader) {
            return this.reader;
        }

        this.reader = new BinReader({
            filename: this.getFullPath(),
            bufferSize: 4096
        });
        return this.reader;
    }
    getFullPath() {
        if (this.path) {
            return this.path;
        }
        const filehelper = FileIndexReader.filehelper;
        let newPath = filehelper.getFilePath(this.options.mulFile);
        const basename = path.basename(newPath, '.mul');

        if (fs.existsSync(newPath)) {
            this.path = newPath;
            this.isUOP = false;

            return this.path;
        }

        newPath = filehelper.getFilePath(`${basename}LegacyMUL.uop`);
        if (fs.existsSync(newPath)) {
            this.path = newPath;
            this.isUOP = true;

            return this.path;
        }

        return null;
    }
    readIndex() {
        if (this.isUOP) {
            throw 'mul is not supported yet';
        }
        const reader = this.getReader();

        if (reader.nextInt() != 0x50594D) {
            throw Error('Header magic number is invalid');
        }
        reader.nextLong(); // version + sig
        let nextBlock = reader.nextLong();
        reader.nextInt(); // block capacity
        const count = reader.nextInt();
        const hashes = this.buildUOPHashes();
        reader.seek(nextBlock);
        const uopFiles = [];
        const index = {};
        while(reader.canRead) {
            const filesCount = reader.nextInt();
            nextBlock = reader.nextULong();
            if (nextBlock <= 0) {
                break;
            }
            for(let i = 0; i < filesCount; i++) {
                const offset = reader.nextLong();
                const headerLength = reader.nextInt();
                const compressedLength = reader.nextInt();
                const decompressedLength = reader.nextInt();
                const hash = [reader.nextUInt(), reader.nextUInt()].reverse().join('.'); // might be .reversed
                reader.nextInt(); //adler32
                const flag = reader.nextShort();

                const idx = (hashes[hash]);

                index[idx] = {
                    lookup: (offset + headerLength),
                    length: flag === 1 ? compressedLength : decompressedLength
                };
            }

            reader.seek(nextBlock);
        }

        this.index = index;
    }
    buildUOPHashes() {
        const hashes = {};
        const basename = path.basename(this.getFullPath().toLowerCase(), '.uop');
        for(let i = 0; i < /*header.count*/this.options.length; i++) {
            const filename = `build/${basename}/${pad(i, 8)}.${this.options.uopFileExtension}`;
            const hashed = hash(filename).join('.');
            hashes[hashed] = i;
        }
        return hashes;
    }
}

module.exports = FileIndexReader;
