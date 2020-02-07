/**
 * Extracts file name from a url.
 * @author Зайцев А.С.
 */
function getNormalizedFileName(path?: string): string {
   if (!path) {
      return '';
   }
   return (
      path
         .replace(/\?.+/, '')
         .replace(/#.+/, '')
         .split(/\/|\\/)
         .pop() || ''
   );
}

export default getNormalizedFileName;
