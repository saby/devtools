import { IBackendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import {
   DehydratedItem,
   DehydrateReturnType,
   ElementType,
   IDehydratedData,
   InspectedPathsMap
} from 'Types/ElementInspection';

/**
 * This function is used to strip away the data that is nested too deep.
 * Also converts some things which can't be properly serialized (e.g., DOM Elements, functions) to the form
 * which consumable by the frontend.
 * @author Зайцев А.С.
 */
export function dehydrateHelper(
   value:
      | IBackendControlNode['options']
      | IBackendControlNode['attributes']
      | IBackendControlNode['state']
      | object, // events
   allowedPaths: InspectedPathsMap,
   path: Array<string | number>
): IDehydratedData | undefined {
   /**
    * TODO: getEvents always returns an object, even if there's no events.
    * It could be refactored later and it'll allow to remove the second check.
    */
   if (!value || Object.keys(value).length === 0) {
      return;
   }
   const cleaned: Array<Array<string | number>> = [];

   const data = dehydrate(
      value,
      cleaned,
      path,
      getIsPathAllowedFunc(allowedPaths)
   );

   return {
      data,
      cleaned
   };
}

const LEVEL_THRESHOLD = 3;

function getIsPathAllowedFunc(
   allowedPaths: InspectedPathsMap
): (path: Array<string | number>) => boolean {
   return function isPathAllowed(path: Array<string | number>): boolean {
      let currentPathMap: InspectedPathsMap | undefined = allowedPaths;
      for (let i = 0; i < path.length; i++) {
         const currentPathPart = path[i];
         currentPathMap = currentPathMap.get(currentPathPart);
         if (!currentPathMap) {
            return false;
         }
      }
      return true;
   };
}

function dehydrate(
   data: unknown,
   cleaned: Array<Array<string | number>>,
   path: Array<string | number>,
   isPathAllowed: (path: Array<string | number>) => boolean,
   level: number = 0
): DehydrateReturnType {
   const type = getDataType(data);

   let pathAllowed: boolean;

   switch (type) {
      case 'htmlElement':
         cleaned.push(path);
         return {
            caption: (data as Element).tagName,
            type
         };
      case 'jqueryElement':
         cleaned.push(path);
         return {
            caption: (data as [Element])[0].tagName,
            type
         };
      case 'undefined':
         cleaned.push(path);
         return {
            type
         };
      case 'array':
         pathAllowed = isPathAllowed(path);
         if (level >= LEVEL_THRESHOLD && !pathAllowed) {
            return createDehydrated(type, data as unknown[], cleaned, path);
         } else {
            return (data as unknown[]).map((item, i) => {
               return dehydrate(
                  item,
                  cleaned,
                  path.concat([i]),
                  isPathAllowed,
                  pathAllowed ? level : level + 1
               );
            });
         }
      case 'regexp':
         cleaned.push(path);
         return {
            type,
            caption: (data as RegExp).toString()
         };
      case 'date':
         cleaned.push(path);
         return {
            type,
            caption: (data as Date).toString()
         };
      case 'object':
         pathAllowed = isPathAllowed(path);
         if (level >= LEVEL_THRESHOLD || !pathAllowed) {
            return createDehydrated(type, data as object, cleaned, path);
         } else {
            const result: Record<string, DehydrateReturnType> = {};

            Object.entries(data as object).forEach(([key, value]) => {
               result[key] = dehydrate(
                  value,
                  cleaned,
                  path.concat([key]),
                  isPathAllowed,
                  pathAllowed ? level : level + 1
               );
            });

            return result;
         }
      case 'function':
         cleaned.push(path);
         return {
            type,
            caption: `function ${(data as Function).name.replace('bound ', '')}`
         };
      default:
         return data as DehydrateReturnType;
   }
}

function isJqueryElement(value: { length?: number; 0?: Element }): boolean {
   return (
      typeof value.length === 'number' &&
      value.length > 0 &&
      value[0] instanceof Element
   );
}

function getDataType(data: unknown): ElementType {
   const type = typeof data;

   switch (type) {
      case 'undefined':
         return 'undefined';
      case 'object':
         if (data === null) {
            return 'null';
         }
         if (Array.isArray(data)) {
            return 'array';
         }
         if (data instanceof RegExp) {
            return 'regexp';
         }
         if (data instanceof Date) {
            return 'date';
         }
         if (data instanceof Element) {
            return 'htmlElement';
         }
         if (isJqueryElement(data as object)) {
            return 'jqueryElement';
         }
         return 'object';
      case 'boolean':
      case 'function':
      case 'string':
      case 'number':
         return type;
      default:
         return 'unknown';
   }
}

function createDehydrated(
   type: 'object' | 'array',
   data: object | unknown[],
   cleaned: Array<Array<string | number>>,
   path: Array<string | number>
): DehydratedItem {
   cleaned.push(path);

   const size =
      type === 'object' ? Object.keys(data).length : (data as unknown[]).length;

   let caption;
   if (size > 0) {
      if (type === 'object') {
         caption = 'Object';
      } else {
         caption = `Array[${size}]`;
      }
   } else {
      caption = `Empty ${type}`;
   }

   return {
      type,
      caption,
      expandable: size > 0
   };
}
