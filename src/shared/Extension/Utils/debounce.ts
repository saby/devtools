function debounce<TArgs extends unknown[] = unknown[], TResult = void>(
    originalFunction: (...args: TArgs) => TResult,
    delay: number
): (...args: TArgs) => void {
   let timer: number;

   return (...args: TArgs): void => {
      if (timer) {
         window.clearTimeout(timer);
      }

      timer = window.setTimeout(() => {
         originalFunction(...args);
      }, delay);
   };
}

export default debounce;
