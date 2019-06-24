import { decycle } from 'Extension/Utils/decycle';

function replaceFunctions<T>(value: T): T | string {
   if (typeof value === 'function') {
      return `function ${value.name.replace('bound ', '')}`;
   }
   return value;
}

const IGNORE_FIELDS = ['_logicParent', '_events', 'controlNode', '_container', '__lastGetterPath'];

export default function prepareForSerialization(value: object): object {
   return decycle(value, {
      replacer: replaceFunctions,
      ignore: IGNORE_FIELDS
   });
}
