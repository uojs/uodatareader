const fs = require('graceful-fs');

const filehelper = require('./filehelper');
const Map = require('./map');

module.exports = function(options) {
    filehelper.initialize(options);

    return {
        Map
    };
};
