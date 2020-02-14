const RELEASE_MODE = 'release';

function getCookie(name: string): string | undefined {
   const matches = document.cookie.match(
      new RegExp(
         '(?:^|; )' +
            name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
            '=([^;]*)'
      )
   );
   return matches ? decodeURIComponent(matches[1]) : undefined;
}

function isDebug(): boolean {
   const debugCookieValue = getCookie('s3debug');
   return !!(debugCookieValue && debugCookieValue !== 'false');
}

/**
 * Determines whether the site runs in production mode.
 * @author Зайцев А.С.
 */
export function isRelease(buildMode: string): boolean {
   return !isDebug() && buildMode === RELEASE_MODE;
}
