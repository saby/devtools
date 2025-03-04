const { output } = require('./config');

module.exports = {
    file: output.injectScript,
    format: 'iife',
    compact: true
};
