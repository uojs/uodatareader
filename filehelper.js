const fs = require('graceful-fs');
const path = require('path');
const options = {
    path: './'
};
const uopFiles = { };

function initialize(newOptions) {
    Object.assign(options, newOptions);
}

function getFilePath(filename) {
    return path.join(options.path, filename);
}

function getUOPFiles(filename) {

}
module.exports = {
    initialize,
    getFilePath
};
