const fs = require('graceful-fs');

const filehelper = require('./filehelper');
const Map = require('./map');
const FileIndexReader = require('./fileindexreader');
const Art = require('./art');

module.exports = function(options) {
    filehelper.initialize(options);

    FileIndexReader.filehelper = Art.filehelper = Map.filehelper = filehelper;
    return {
        Map,
        FileIndexReader
    };
};
