function getFileName(path?: string): string {
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

export default getFileName;
