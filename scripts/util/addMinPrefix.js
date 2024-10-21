'use strict';
const { writeFile, readFile } = require('fs').promises;
const { resolve } = require('path');
const appIndex = resolve(__dirname, "../../build/devtool/app-index.html");

function addPrefix(content) {
   return content
      .replace(/(\.min)?\.css/g, '.min.css')
      .replace(
         /([\w]+[\s]*=[\s]*)((?:"|')(?:[A-z]+(?!:\/)|\/|(?:\.|\.\.)\/|%[^}]+}|{{[^{}]*}})[\w/+-.]+(?:\.\d+)?)(\.js)/gi,
         (match, partEqual, partFilePath, partExt) => {
            if (partFilePath.startsWith(`"./`) || !/^src|^href/i.test(match)) {
               return match;
            }

            const partFilePathWithoutMin = partFilePath.replace(/\.min$/, '');
            return `${partEqual}${partFilePathWithoutMin}.min${partExt}`;
         }
      );
}

async function addMinPrefix(filePath) {
   const initialHTML = await readFile(filePath);
   return writeFile(filePath, addPrefix(initialHTML.toString()));
}

module.exports = () => {
  return addMinPrefix(appIndex);
};
