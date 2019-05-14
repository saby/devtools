function debounce<T extends unknown[]>(originalFunction: (...args: T) => void, delay: number): (...args: T) => void {
   let timer: number;

   return (...args: T): void => {
      if (timer) {
         window.clearTimeout(timer);
      }

      timer = window.setTimeout(() => {
         originalFunction(...args);
      }, delay);
   };
}

export default debounce;
