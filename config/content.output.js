const { output } = require('./config');

module.exports = {
    file: output.content,
    format: 'iife',
    compact: true
};
