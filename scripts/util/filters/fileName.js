const CHECK_METHODS = {
    endsWith: path => str => path.endsWith(str),
    includes: path => str => path.includes(str),
    startsWith: path => str => path.startsWith(str),
    equal: path => str => path === str
};


/**
 *
 * @param {'includes' | 'endsWith' | 'startsWith' | 'equal'} method
 */
let getCheckMethod = method => CHECK_METHODS[method];

let getWhiteList = checkMethod => list => path => list.some(checkMethod(path));

let getBlackList = checkMethod => list => path => !list.some(checkMethod(path));

module.exports = {
    /**
     * get filter for white list
     */
    whiteList: {
        endsWith: getWhiteList(getCheckMethod('endsWith')),
        includes: getWhiteList(getCheckMethod('includes')),
        startsWith: getWhiteList(getCheckMethod('startsWith')),
        equal: getWhiteList(getCheckMethod('equal')),
    },
    /**
     * get filter for black list
     */
    blackList: {
        endsWith: getBlackList(getCheckMethod('endsWith')),
        includes: getBlackList(getCheckMethod('includes')),
        startsWith: getBlackList(getCheckMethod('startsWith')),
        equal: getBlackList(getCheckMethod('equal')),
    },
};
