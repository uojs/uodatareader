const fs = require('graceful-fs');
const path = require('path');
const hash = require('uop-hash');

const FileIndexReader = require('./fileindexreader');
const pad = require('./pad');

class Map {

    constructor(options) {
        if (options.fileIndex === undefined) {
            throw new Error('file index is undefined');
        }
        if (options.height < 0 || options.width < 0) {
            throw new Error('dimensions are invalid');
        }
        if (options.mapId === undefined) {
            throw new Error('map id is undefined');
        }

        this.options = options;
        this.index   = new FileIndexReader({
            baseDirectory:    options.baseDirectory,
            indexFile:        `map${options.fileIndex}.idx`,
            mulFile:          `map${options.fileIndex}.mul`,
            uopFileExtension: 'dat'
        });
        console.log(`begin loading map ${options.fileIndex}...`);
        console.time(`loaded map ${options.fileIndex}`);
        //this.map = this.loadMap();
        this.tileLength = this.blockHeight * this.blockWidth * 64;
        this.map = this.loadMap();
        console.timeEnd(`loaded map ${options.fileIndex}`);

        //const landLength = this.landLength = this.blockHeight * this.blockWidth * 64;
        //console.log('land length = ', landLength);
        //this.landIds = new Uint16Array(landLength);
        //this.landZs = new Int8Array(landLength);
    }
    get blockHeight() {
        return this.options.height >> 3;
    }
    get blockWidth() {
        return this.options.width >> 3;
    }

    loadMap() {
        const result = [];

        for(let y = 0; y < this.blockWidth; y++) {
            for(let x = 0; x < this.blockHeight; x++) {
                // console.time('Me');
                const block = this._readBlock(x, y);
                // console.timeEnd('Me');

                for(let i in block) {
                    if(block.hasOwnProperty(i)) {
                        const resultY = ~~(i / 8) + (y * 8);

                        if(!result[resultY]) {
                            result.push([]);
                        }

                        result[resultY].push(block[i]);
                    }
                }
            }
        }

        return result;
    }

    expandArray(ids, z) {
        return Array(64)
            .fill(null)
            .map((o, i) => {
                return {
                    id: ids[i],
                    z: z[i]
                };
            });
    }
    calculateLocalBufferOffset(x, y) {
        //return (x * 64 + y);
        return ((x * this.blockHeight) + y) * 64;
    }
    getLandBlock(x, y) {
        if (x < 0 || y < 0 || x >= this.blockWidth || y >= this.blockHeight) {
            throw new Error (`Out of bounds: (x = ${x}, y = ${y})`);
        }

        const offset = this.calculateLocalBufferOffset(x, y);
        const ids = this.tileData.ids.subarray(offset, offset + 64);
        const z = this.tileData.z.subarray(offset, offset + 64);

        return this.expandArray(ids, z);
    }
    getLandBlock_old(x, y) {
        if (x < 0 || y < 0 || x >= this.blockWidth || y >= this.blockHeight) {
            throw new Error (`Out of bounds: (x = ${x}, y = ${y})`);
        }

        return this.readLandBlock(x, y);
        const block = this.map[x][y];

        return Array(64)
            .fill(null)
            .map((o, i) => {
                return {
                    id: block.ids[i],
                    z: block.z[i]
                };
            });
        //return this.readLandBlock(x, y);
    }

    readMyMethod(x, y, size) {
        /*
         SizeOfLandChunk = 196

         Block:
            Y: real position (Y / 8)
            X: real position (X / 8)
            SIZE-CHUNK : 196
            HEIGHT-CHUNK : map id: 0 = 512, 1 = 512, 2 = 200, 3 = 256, 4 = 181

            (({X} * {HEIGHT-CHUNK}) + {Y}) * {SIZE-CHUNK} + 4

         Cell:
            Y: min `0` max `7`
            X: min `0` max `7`

            (({Y} * 8) + {X}) * 3

         Block + Cell:
            ((({X} * {HEIGHT-CHUNK}) + {Y}) * {SIZE-CHUNK} + 4) + (({Y} * 8) + {X}) * 3
        */

        const cell = {
            startX: x - size,
            startY: y - size,
            endX : x + size,
            endY : y + size
        };

        const block = {
            startX: ~~(cell.startX / 8),
            startY: ~~(cell.startY / 8),
            endX : ~~(cell.endX / 8),
            endY : ~~(cell.endY / 8)
        };

        let startPositionX = cell.startX % 8;
        let startPositionY = cell.startY % 8;

        const aResult = [];

        // Blocks
        for(let blockY = block.startY; blockY <= block.endY; blockY++) {
            for(let blockX = block.startX; blockX <= block.endX; blockX++) {
                // Cells
                for(let cellY = startPositionY; cellY < 8; cellY++) {
                    const globalY = (blockY * 8) + cellY;
                    const resultY = globalY - cell.startY;

                    if(globalY > cell.endY) {
                        break;
                    }

                    if(!aResult[resultY]) {
                        aResult.push([])
                    }

                    for(let cellX = startPositionX; cellX < 8; cellX++) {
                        if((blockX * 8) + cellX > cell.endX) {
                            break;
                        }

                        aResult[resultY].push(this.map[cellY][cellX])
                    }
                }

                startPositionX = 0;
            }

            startPositionY = 0;
            startPositionX = cell.startX % 8;
        }

        return aResult;
    }

    _readBlock(x, y) {
        let offset = ((x * this.blockHeight) + y) * 196 + 4;

        if(this.index.isUOP) {
            offset = this.calculateOffset(offset);
        }

        if(!this.index.reader.seek(offset)) {
            throw new Error(`could not seek to ${offset}`);
        }

        const result = [];

        for(let i = 0; i < 64; ++i) {
            result.push({
                id : this.index.reader.nextUShort(),
                z : this.index.reader.nextSByte()
            })
        }

        return result;
    }

    readLandBlock(x, y) {
        let offset = ((x * this.blockHeight) + y) * 196 + 4;
        if (this.index.isUOP) {
            offset = this.calculateOffset(offset);
            //console.log('uop offset -> ', offset);
        }

        if (!this.index.reader.seek(offset)) {
            throw new Error(`could not seek to ${offset}`);
        }
        const ids = new Uint16Array(64);
        const z = new Int8Array(64);

        for(var i = 0; i < 64; ++i) {
            ids[i] = this.index.reader.nextUShort();
            z[i] = this.index.reader.nextSByte();
        }
        /*
        return Array(64)
            .fill(null)
            .map((o, i) => {
                return {
                    id: ids[i],
                    z: z[i]
                };
            });*/
        return {
            ids,
            z
        };
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
        return length;
    }
}

module.exports = Map;
