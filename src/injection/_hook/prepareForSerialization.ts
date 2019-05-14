function replaceFunctions<T>(value: T): T | string {
   if (typeof value === 'function') {
      return value.name.replace('bound ', '');
   }
   return value;
}

function decycle<T>(object: T, replacer?: <U>(value: U) => U | string): T {

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

   const objects = new WeakMap();     // object to path mappings

   return (function derez(value, path) {

// The derez function recurses through the object, producing the deep copy.

      let oldPath;   // The path of an earlier occurance of value
      let nu;         // The new object or array

// If a replacer function was provided, then call it to get a replacement value.

      if (replacer !== undefined) {
         value = replacer(value);
      }

// typeof null === "object", so go on if this value is really an object but not
// one of the weird builtin objects.

      if (
         typeof value === 'object'
         && value !== null
         && !(value instanceof Boolean)
         && !(value instanceof Date)
         && !(value instanceof Number)
         && !(value instanceof RegExp)
         && !(value instanceof String)
      ) {

// If the value is an object or array, look to see if we have already
// encountered it. If so, return a {"$ref":PATH} object. This uses an
// ES6 WeakMap.

         oldPath = objects.get(value);
         if (oldPath !== undefined) {
            return {$ref: oldPath};
         }

// Otherwise, accumulate the unique value and its path.

         objects.set(value, path);

// If it is an array, replicate the array.

         if (Array.isArray(value)) {
            nu = [];
            value.forEach(function(element, i) {
               nu[i] = derez(element, path + '[' + i + ']');
            });
         } else {

// If it is an object, replicate the object.

            nu = {};
            Object.keys(value).forEach(function(name) {
               nu[name] = derez(
                  value[name],
                  path + '[' + JSON.stringify(name) + ']'
               );
            });
         }
         return nu;
      }
      return value;
   }(object, '$'));
}

// TODO: опции, через которые тянется всё дерево компонентов, поэтому с ними нужно что-то делать. В идеале бы нужно просто заменять их на строки с названием контрола, и соотносить со ссылками на инстансы
const LONG_OPTIONS = ['_logicParent', 'opener', '_events', 'content'];

function deleteLongOptions(value: object): void {
   if (value.options) {
      LONG_OPTIONS.forEach((option) => {
         if (value.options[option]) {
            delete value.options[option];
         }
      });
   }
}

export default function prepareForSerialization(value: object): object {
   const decycledValue = decycle(value, replaceFunctions);
   deleteLongOptions(decycledValue);
   return decycledValue;
}
