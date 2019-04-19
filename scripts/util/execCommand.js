const { exec } = require('child_process');

/**
 *
 * @param {string} command
 * @param {boolean} throwError
 * @return {Promise<Promise<any> | Promise>}
 */
let execCommand = async (command, throwError = false) => {
    return new Promise((resolve, reject) => {
        console.log('exec command: ', command);
        exec(command, { maxBuffer: 1024 * 500 }, (err, stdout, stderr) => {
            console.log(stdout);
            if (err) {
                console.error(err);
                if (throwError) {
                    return reject(err);
                }
            }
            resolve({ stdout, stderr });
        });
    });
};

module.exports = execCommand;
