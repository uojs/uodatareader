const fs = require('graceful-fs');
const path = require('path');
const hash = require('uop-hash');
const BinReader = require('binreader');

const pad = require('./pad');

class FileIndexReader {
    constructor(options) {
        this.options = options;
        this.readIndex();
    }
    get length() {
        if (this.indexLookups) {
            return this.indexLookups.length;
        }
        return 0;
    }
    lookup(index) {
        if (!this.indexLookups) {
            return null;
        }
        if (index < 0 || index >= this.indexLookups.length) {
            return {
                lookup: -1,
                length: -1
            };
        }
        return {
            lookup: this.indexLookups[index],
            length: this.indexLengths[index]
        };
    }
    getReader() {
        if (this.reader) {
            return this.reader;
        }

        this.reader = new BinReader({
            filename: this.getFullPath(),
            bufferSize: 100 * 1024 * 1024
        });
        return this.reader;
    }
    getFullPath() {
        if (this.path) {
            return this.path;
        }
        let newPath = path.join(this.options.baseDirectory, this.options.mulFile);
        const basename = path.basename(this.options.mulFile, '.mul');

        if (fs.existsSync(newPath)) {
            this.path = newPath;
            this.isUOP = false;

            return this.path;
        }

        newPath = path.join(this.options.baseDirectory, `${basename}LegacyMUL.uop`);
        if (fs.existsSync(newPath)) {
            this.path = newPath;
            this.isUOP = true;

            return this.path;
        }

        return null;
    }
    readIndex() {
        const reader = this.getReader();

        if (!this.isUOP) {
            throw 'mul is not supported yet';
        }

        if (reader.nextInt() != 0x50594D) {
            throw 'header magic number is invalid';
        }
        reader.nextLong(); // version + sig
        let nextBlock = reader.nextLong();
        const blockCapacity = reader.nextInt();
        const count = reader.nextInt();

        if (!this.options.length) {
            this.options.length = count;
        }
        const hashes = this.buildUOPHashes();
        const indexLookups = new Int32Array(this.options.length);
        const indexLengths = new Int32Array(this.options.length);
        reader.seek(nextBlock);
        do {
            const filesCount = reader.nextInt();
            nextBlock = reader.nextULong();
            /*if (nextBlock <= 0) {
                break;
            }*/
            for(let i = 0; i < filesCount; i++) {
                const offset = reader.nextULong();
                //console.log(offset);

                const headerLength = reader.nextInt();
                const compressedLength = reader.nextInt();
                const decompressedLength = reader.nextInt();
                const hash = [reader.nextUInt(), reader.nextUInt()].reverse().join('.');
                reader.nextInt(); //adler32
                const flag = reader.nextShort();
                if (offset === 0) {
                    continue;
                }
                const idx = hashes[hash];
                /*index[idx] = {
                    lookup: (offset + headerLength),
                    length: flag === 1 ? compressedLength : decompressedLength
                }*/

                indexLookups[idx] = (offset + headerLength);
                indexLengths[idx] = flag === 1 ? compressedLength : decompressedLength;

                /*if (this.options.hasExtra) {
                    throw 'extra flags not supported at this time';
                }*/
            }
        } while (reader.canRead && reader.seek(nextBlock));

        this.indexLookups = indexLookups;
        this.indexLengths = indexLengths;
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
