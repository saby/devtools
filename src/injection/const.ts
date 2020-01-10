// TODO: попробовать использовать globalThis
// tslint:disable-next-line:only-arrow-functions
export const GLOBAL = (function(): object {
   if (typeof self !== 'undefined') {
      return self;
   }
   if (typeof window !== 'undefined') {
      return window;
   }
   if (typeof global !== 'undefined') {
      return global;
   }
   throw new Error('unable to locate global object');
})();
