const Map = require('./map');
const FileIndexReader = require('./fileindexreader');
const Art = require('./art');
const Texture = require('./texture');

function initialize(config) {
    const maps = {};
    const baseDirectory = config.baseDirectory;

    (config.maps || []).forEach(map => {
        map.baseDirectory = baseDirectory;
        maps[map.mapId] = new Map(map);
    });

    const art = new Art({ baseDirectory });
    const texture = new Texture({ baseDirectory })
    return {
        Map,
        Art,
        Texture,
        FileIndexReader,
        maps,
        art,
        texture
    };
}

module.exports = initialize;
