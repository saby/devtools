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
      } else if (hashExtender[key] instanceof Date) {
         hash[key] = new Date(hashExtender[key]);
      } else {
         hash[key] = hashExtender[key];
      }
   } else {
      hash[key] = hashExtender[key];
   }
}

function mergeInner(
   hash: object,
   hashExtender: object,
   currentKey: string | null,
   path: IPath
): object {
   if (hashExtender instanceof Date) {
      return new Date(hashExtender);
   }

   path.keys.push(currentKey === null ? '.' : currentKey);
   if (path.objects.indexOf(hashExtender) > -1) {
      throw new Error(
         `Recursive traversal detected for path "${path.keys.join(
            ' -> '
         )}" with ${hashExtender}`
      );
   }
   path.objects.push(hashExtender);

   Object.keys(hashExtender).forEach((key) => {
      cloneOrCopy(hash, hashExtender, key, path);
   });

   path.keys.pop();
   path.objects.pop();

   return hash;
}

/**
 * Deep clones an object.
 * @param originalObject Object to clone.
 * @return New object which is a deep clone of the original.
 * @author Зайцев А.С.
 */
export default function deepClone(originalObject?: object): object | undefined {
   if (!originalObject) {
      return;
   }
   return mergeInner({}, originalObject, null, { keys: [], objects: [] });
}
