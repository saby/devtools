function isEqualVersion(obj1: object, obj2: object): boolean {
   const isVersionableObject =
      typeof obj1.getVersion === 'function' &&
      typeof obj2.getVersion === 'function';

   if (isVersionableObject) {
      return obj1.getVersion() === obj2.getVersion();
   } else {
      return true;
   }
}

function isTraversable(value: unknown): value is object | Date {
   let proto;
   if (value && typeof value === 'object') {
      if (value instanceof Date) {
         return true;
      }
      proto = Object.getPrototypeOf(value);
      return proto === null || proto === Object.prototype;
   }

   return false;
}

function isEqualArrays(arr1: unknown[], arr2: unknown[]): boolean {
   if (arr1.length !== arr2.length) {
      return false;
   }

   return !arr1.some((item, index) => {
      return !isDeepEqual(item, arr2[index]);
   });
}

function isEqualObjects(obj1: object, obj2: object): boolean {
   const keys1 = Object.keys(obj1);
   const keys2 = Object.keys(obj2);

   if (keys1.length !== keys2.length) {
      return false;
   }

   if (!isEqualVersion(obj1, obj2)) {
      return false;
   }

   keys1.sort();
   keys2.sort();
   if (keys1.length > 0) {
      return !keys1.some((key, index) => {
         return !(keys2[index] === key && isDeepEqual(obj1[key], obj2[key]));
      });
   }

   return Object.getPrototypeOf(obj1) === Object.getPrototypeOf(obj2);
}

/**
 * Returns whether two values are equal.
 * @param obj1 First value to compare.
 * @param obj2 Second value to compare.
 * @return Whether two values are equal.
 * @author Зайцев А.С.
 */
export default function isDeepEqual(obj1: unknown, obj2: unknown): boolean {
   const equal = obj1 === obj2;
   let val1;
   let val2;
   let isArray1;
   let isArray2;

   if (equal) {
      return equal;
   }

   isArray1 = Array.isArray(obj1);
   isArray2 = Array.isArray(obj2);
   if (isArray1 !== isArray2) {
      return false;
   }
   if (isArray1) {
      return isEqualArrays(obj1 as unknown[], obj2 as unknown[]);
   }

   if (isTraversable(obj1) && isTraversable(obj2)) {
      if (obj1.valueOf && obj1.valueOf === obj2.valueOf) {
         val1 = obj1.valueOf();
         val2 = obj2.valueOf();
      } else {
         val1 = obj1;
         val2 = obj2;
      }
      return val1 === obj1 && val2 === obj2 ? isEqualObjects(obj1, obj2) : isDeepEqual(val1, val2);
   } else if (obj1 && obj1['[Types/_entity/IEquatable]']) {
      return obj1.isEqual(obj2);
   } else if (obj2 && obj2['[Types/_entity/IEquatable]']) {
      return obj2.isEqual(obj1);
   }

   return false;
}
