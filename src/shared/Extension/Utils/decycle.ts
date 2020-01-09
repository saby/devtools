export function decycle(
   object: object,
   options?: {
      replacer?: <U>(value: U) => U | string,
      ignore?: string[]
   }): object {
   // Make a deep copy of an object or array, assuring that there is at most
   // one instance of each object or array in the resulting structure. The
   // duplicate references (which might be forming cycles) are replaced with
   // an object of the form

   //      {"$ref": PATH}

   // where the PATH is a JSONPath string that locates the first occurance.

   // So,

   //      var a = [];
   //      a[0] = a;
   //      return JSON.stringify(JSON.decycle(a));

   // produces the string '[{"$ref":"$"}]'.

   // If a replacer function is provided, then it will be called for each value.
   // A replacer function receives a value and returns a replacement value.

   // JSONPath is used to locate the unique object. $ indicates the top level of
   // the object or array. [NUMBER] or [STRING] indicates a child element or
   // property.

   const objects = new WeakMap(); // object to path mappings

   // tslint:disable-next-line:no-any
   return (function derez(value: unknown, path: string): any {
      // The derez function recurses through the object, producing the deep copy.

      let oldPath; // The path of an earlier occurance of value
      let nu; // The new object or array
      let tempValue = value;

      // If a replacer function was provided, then call it to get a replacement value.

      if (options && typeof options.replacer === 'function') {
         tempValue = options.replacer(tempValue);
      }

      // typeof null === "object", so go on if this value is really an object but not
      // one of the weird builtin objects.

      if (
         typeof tempValue === 'object' &&
         tempValue !== null &&
         !(tempValue instanceof Boolean) &&
         !(tempValue instanceof Date) &&
         !(tempValue instanceof Number) &&
         !(tempValue instanceof RegExp) &&
         !(tempValue instanceof String)
      ) {
         // If the value is an object or array, look to see if we have already
         // encountered it. If so, return a {"$ref":PATH} object. This uses an
         // ES6 WeakMap.

         oldPath = objects.get(tempValue);
         if (oldPath !== undefined) {
            return { $ref: oldPath };
         }

         // Otherwise, accumulate the unique value and its path.

         objects.set(tempValue, path);

         // If it is an array, replicate the array.

         if (Array.isArray(tempValue)) {
            nu = [];
            tempValue.forEach((element, i) => {
               nu[i] = derez(element, path + '[' + i + ']');
            });
         } else {

            // If it is an object, replicate the object.

            nu = {};
            Object.keys(tempValue).forEach((name) => {
               if (options && options.ignore && options.ignore.indexOf(name) !== -1) {
                  return;
               }
               nu[name] = derez(
                  tempValue[name],
                  path + '[' + JSON.stringify(name) + ']'
               );
            });
         }
         return nu;
      }
      return tempValue;
   })(object, '$');
}
