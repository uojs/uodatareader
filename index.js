const fs = require('graceful-fs');

const Map = require('./map');
const FileIndexReader = require('./fileindexreader');
const Art = require('./art');

function initialize(config) {
    const maps = {};
    const baseDirectory = config.baseDirectory;

    (config.maps || []).forEach(map => {
        maps[map.id] = new Map({
            baseDirectory,
            mapId: map.id
        });
    });

    art = new Art({ baseDirectory });

    return {
        Map,
        Art,
        FileIndexReader,
        maps,
        art
    };
}

module.exports = initialize;
