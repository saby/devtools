const { writeFile } = require('fs').promises;

module.exports = async (filePath) => {
    const jsonData = require(filePath);
    let jsonName = `${ filePath }.json`;
    await writeFile(jsonName, JSON.stringify(jsonData, undefined, 2));
    return jsonName;
};
