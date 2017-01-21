const debug = require('debug')('map');
const FileIndexReader = require('./fileindexreader');

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

        debug('Loaded map %s', options.fileIndex);
        this.map = this.loadMap();
    }

    get blockHeight() {
        return this.options.height >> 3;
    }

    get blockWidth() {
        return this.options.width >> 3;
    }

    loadMap() {
        let result = [];

        debug('Start loop loaded map');
        for(let y = 0; y < this.blockWidth; y++) {
            for(let x = 0; x < this.blockHeight; x++) {
                const block = this._readBlock(x, y);

                for(let i in block) {
                    const resultY = ~~(i / 8) + (y * 8);

                    if(!result[resultY]) {
                        result.push([]);
                    }

                    result[resultY].push(block[i]);
                }
            }
        }
        debug('End loop loaded map');

        return result;
    }

    getBlock(x, y) {
        return this.getTiles(x * 8, y * 8);
    }

    getTiles(x, y, size) {
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

        const diff = {
            start   : typeof size === 'number' ? size : 0,
            end     : typeof size === 'number' ? size : 7
        };

        const cell = {
            startX: x - diff.start,
            startY: y - diff.start,
            endX : x + diff.end,
            endY : y + diff.end
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

                    // Support old style format method getBlock
                    if(size && !aResult[resultY]) {
                        aResult.push([])
                    }

                    for(let cellX = startPositionX; cellX < 8; cellX++) {
                        const globalX = (blockX * 8) + cellX;

                        if(globalX > cell.endX) {
                            break;
                        }

                        if(size) {
                            aResult[resultY].push(this.map[globalY][globalX])
                        } else {
                            // Support old style format method getBlock
                            aResult.push(this.map[globalY][globalX])
                        }
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
            offset = this._calculateOffset(offset);
        }

        if(!this.index.reader.seek(offset)) {
            throw new Error(`could not seek to ${offset}`);
        }

        const result = [];

        for(let i = 0; i < 64; ++i) {
            result.push({
                id: this.index.reader.nextUShort(),
                z : this.index.reader.nextSByte()
            })
        }

        return result;
    }

    _calculateOffset(offset) {
        let pos = 0;
        const index = this.index;
        const length = index.length;

        for(let i = 0; i < length; i++) {
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
