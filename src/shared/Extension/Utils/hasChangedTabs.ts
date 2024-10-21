import { IExtensionOptions } from 'Extension/Utils/loadOptions';

export function hasChangedTabs(
   obj: object
): obj is {
   tabs: {
      newValue: IExtensionOptions['tabs'];
      oldValue: IExtensionOptions['tabs'];
   };
} {
   return obj.hasOwnProperty('tabs');
}
