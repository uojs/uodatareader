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

        this.chunkHeightList = [
            512,
            512,
            200,
            256,
            181
        ];
    }

    get chunkHeight() {
        return this.chunkHeightList[this.options.mapId];
    }

    getLandBlock(x, y) {
        if (x < 0 || y < 0) {
            throw new Error (`Out of bounds: (x = ${x}, y = ${y})`);
        }

        return this.readLandBlock(x, y);
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

        // Blocks
        for(let y = block.startY; y <= block.endY; y++) {
            for(let x = block.startX; x <= block.endX; x++) {
                let offset = ((x * this.chunkHeight) + y) * 196 + 4;

                // Cells
                for(let cellY = 0; cellY < 8; cellY++) {
                    for(let cellX = 0; cellX < 8; cellX++) {
                        if((y * 8) + cellY >= cell.startY && (y * 8) + cellY <= cell.endY) {
                            if((x * 8) + cellX >= cell.startX && (x * 8) + cellX <= cell.endX) {
                                offset = offset + ((cellY * 8) + cellX) * 3;

/*
                                if (this.index.isUOP) {
                                    offset = this.calculateOffset(offset);
                                }

                                // console.log(2, offset);
                                if (!this.index.reader.seek(offset)) {
                                    throw `could not seek to ${offset}`;
                                }

                                return Array(size).fill(null).map((x, index) => {
                                    const id = this.index.reader.nextUShort();
                                    const z = this.index.reader.nextSByte();

                                    return {
                                        id,
                                        z
                                    };
                                })
*/
                                console.log(cellY, cellX)
                            }
                        }
                    }
                }

                // console.log('block', y, x);
            }
        }


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
        let offset = ((x * this.chunkHeight) + y) * 196 + 4;

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
