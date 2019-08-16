interface IPath {
   keys: string[];
   objects: object[];
}

function isMergeableObject(o: object): boolean {
   return (
      o &&
      ((o.constructor === Object && !('$constructor' in o)) ||
         o.constructor === Array)
   );
}

function cloneOrCopy(
   hash: object,
   hashExtender: object,
   key: string,
   path: IPath
): void {
   if (typeof hashExtender[key] === 'object' && hashExtender[key] !== null) {
      if (isMergeableObject(hashExtender[key])) {
         hash[key] = mergeInner(
            hashExtender[key] instanceof Array ? [] : {},
            hashExtender[key],
            key,
            path
         );
      } else {
         hash[key] = hashExtender[key];
      }
   } else {
      hash[key] = hashExtender[key];
   }
}

function mergeInner(
   hash: unknown,
   hashExtender: unknown,
   currentKey: string | null,
   path: IPath
): object {
   if (hashExtender instanceof Date) {
      return new Date(hashExtender);
   }

   if (
      hash !== null &&
      typeof hash === 'object' &&
      hashExtender !== null &&
      typeof hashExtender === 'object'
   ) {
      path.keys.push(currentKey === null ? '.' : currentKey);
      if (path.objects.indexOf(hashExtender) > -1) {
         throw new Error(
            `Recursive traversal detected for path "${path.keys.join(
               ' -> '
            )}" with ${hashExtender}`
         );
      }
      path.objects.push(hashExtender);

      for (const i in hashExtender) {
         if (!hashExtender.hasOwnProperty(i)) {
            continue;
         }

         if (hash[i] === undefined) {
            if (hashExtender[i] === null) {
               hash[i] = null;
            } else {
               cloneOrCopy(hash, hashExtender, i, path);
            }
         } else {
            if (
               hash[i] &&
               typeof hash[i] === 'object' &&
               typeof hashExtender[i] === 'object'
            ) {
               if (hash[i] instanceof Date) {
                  if (hashExtender[i] instanceof Date) {
                     hash[i] = new Date(+hashExtender[i]);
                     continue;
                  } else {
                     hash[i] = hashExtender[i] instanceof Array ? [] : {};
                  }
               } else if (hashExtender[i] instanceof Date) {
                  hash[i] = new Date(+hashExtender[i]);
                  continue;
               }

               if (
                  (isMergeableObject(hashExtender[i]) ||
                     hashExtender[i] === null) &&
                  Object.keys(hash[i]).length > 0
               ) {
                  hash[i] = mergeInner(hash[i], hashExtender[i], i, path);
               }
            } else {
               cloneOrCopy(hash, hashExtender, i, path);
            }
         }
      }

      path.keys.pop();
      path.objects.pop();
   } else {
      hash = hashExtender;
   }

   return hash;
}

export default function deepClone(originalObject?: object): object | undefined {
   if (!originalObject) {
      return;
   }
   return mergeInner({}, originalObject, null, { keys: [], objects: [] });
}
