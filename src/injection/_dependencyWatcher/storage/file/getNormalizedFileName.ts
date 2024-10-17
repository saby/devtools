/**
 * Extracts file name from a url.
 * @author Зайцев А.С.
 */
function getNormalizedFileName(path: string): string {
   return path
      .replace(/\?.+/, '')
      .replace(/#.+/, '')
      .split(/\/|\\/)
      .pop() as string;
}

export default getNormalizedFileName;
