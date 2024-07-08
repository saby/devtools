const rollup = require('rollup');

const inputConfig = require('../config/inject.input');
const outputConfig = require('../config/inject.output');

rollup.rollup(inputConfig).then((bundle) => {
    return bundle.write(outputConfig);
});
