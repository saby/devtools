const { resolve } = require('path');
const NODE_MODULES = resolve(__dirname, "../../node_modules");

module.exports = (buildTemplatePath) => {
    return [
        "node",
        resolve(NODE_MODULES, "gulp/bin/gulp.js"),
        `--gulpfile=${ resolve(NODE_MODULES, "sbis3-builder/gulpfile.js") }`,
        "build",
        `--config="${ buildTemplatePath }"`,
        "-LL",
        process.env.NODE_ENV === 'production' ? '--log-level=error' : ''
    ].join(' ');
};
