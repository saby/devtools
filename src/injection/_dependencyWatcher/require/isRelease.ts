const IS_DEBUG = document.cookie.indexOf('s3debug=true') > -1;
const RELEASE_MODE = 'release';
const DEBUG_MODE = 'debug';

export const isRelease = (buildMode: string): boolean => {
    return !IS_DEBUG && buildMode === RELEASE_MODE;
};
