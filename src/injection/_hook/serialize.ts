function serialize(value: unknown): unknown {
   if (typeof value === 'object') {
      if (value instanceof Array) {
         value.forEach((item, index) => {
            value[index] = serialize(item);
         });
      } else if (value) {
         Object.keys(value).forEach((key) => {
            value[key] = serialize(value[key]);
         });
      }
   }
   if (typeof value === 'function') {
      return 'function';
   }
   return value;
}

export {
   serialize
};
