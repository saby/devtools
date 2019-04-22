const rollup = require('rollup');

const inputConfig = require('../config/content.input');
const outputConfig = require('../config/content.output');

rollup.rollup(inputConfig).then((bundle) => {
    return bundle.write(outputConfig);
});
