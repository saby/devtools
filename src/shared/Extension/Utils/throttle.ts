export function throttle(
   func: Function,
   delay: number
): (...args: unknown[]) => void {
   let wasCalled = false;
   let next: Function | undefined;
   return (...args: unknown[]): void => {
      if (!wasCalled) {
         func.apply(null, args);
         wasCalled = true;
         setTimeout(() => {
            if (next) {
               next();
            }
            wasCalled = false;
         }, delay);
      } else {
         next = func.bind(null, ...args);
      }
   };
}
