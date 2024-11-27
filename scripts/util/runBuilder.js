const execCommand = require('./execCommand');
const createBuildTemplate = require('./createBuildTemplate');
const getBuilderCommand = require('./getBuilderCommand');

module.exports = async (fileName) => {
    console.log('run build');
    let jsonName = await createBuildTemplate(fileName);
    let command = getBuilderCommand(jsonName);
    await execCommand(command);
    console.log('complete build');
};
