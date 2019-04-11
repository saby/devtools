const rollup = require('rollup');

const inputConfig = require('../config/rollup.input');
const outputConfig = require('../config/rollup.output');

rollup.rollup(inputConfig).then((bundle) => {
    return bundle.write(outputConfig);
});
