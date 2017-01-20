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
        this.loadMap();
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
        const ids = new Uint16Array(this.tileLength);
        const z = new Int8Array(this.tileLength);
        const blockHeight = this.blockHeight;
        const blockWidth = this.blockWidth;

        for(let x = 1; x < blockHeight; x++) {
            for(let y = 1; y < blockWidth; y++) {
                const block = this.readLandBlock(x, y);
                //const offset = (x * blockHeight + y) * 64;
                const offset = this.calculateLocalBufferOffset(x, y);
                ids.set(block.ids, offset);
                z.set(block.z, offset);
            }
        }

        this.tileData = {
            ids,
            z
        };
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
                let blockOffset = ((blockX * this.chunkHeight) + blockY) * 196 + 4;

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

                        let offsetCell = blockOffset + ((cellY * 8) + cellX) * 3;

                        if(this.index.isUOP) {
                            offsetCell = this.calculateOffset(offsetCell);
                        }

                        if(!this.index.reader.seek(offsetCell)) {
                            throw `could not seek to ${offsetCell}`;
                        }

                        aResult[resultY].push({
                            id : this.index.reader.nextUShort(),
                            z : this.index.reader.nextSByte()
                        })
                    }
                }

                startPositionX = 0;
            }

            startPositionY = 0;
            startPositionX = cell.startX % 8;
        }

        return aResult;

        // let offset = (((~~(x / 8) * this.chunkHeight) + ~~(y / 8)) * 196 + 4) + ((8 * 8) + 7) * 3;
        // let offset = ((~~(x / 8) * this.chunkHeight) + ~~(y / 8)) * 196 + 4;

        // console.log(1, offset);
        // if (this.index.isUOP) {
        //     offset = this.calculateOffset(offset);
        // }

        // console.log(2, offset);
        // if (!this.index.reader.seek(offset)) {
        //     throw `could not seek to ${offset}`;
        // }

        // console.log(3, offset);
        /*console.log({
            id : this.index.reader.nextUShort(),
            z : this.index.reader.nextSByte()
        });*/
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
