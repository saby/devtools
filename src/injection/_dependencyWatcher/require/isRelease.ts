const IS_DEBUG = document.cookie.indexOf('s3debug=true') > -1;
const RELEASE_MODE = 'release';

/**
 * Determines whether the site runs in production mode.
 * @author Зайцев А.С.
 */
export function isRelease(buildMode: string): boolean {
   return !IS_DEBUG && buildMode === RELEASE_MODE;
}
