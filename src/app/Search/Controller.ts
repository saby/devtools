import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';

interface IResult {
   id?: IFrontendControlNode['id'];
   index: number;
   total: number;
}

type SearchableItem<T extends string> = Record<T, string> &
   Record<'id', number>;

/**
 * Manages search in a collection. Has methods for calculating search result and getting the next item.
 * @author Зайцев А.С.
 */
class Controller<T extends string> {
   private _displayProperty: T;
   private _lastFoundItemIndex: number = 0;
   private _searchResults: Array<SearchableItem<T>> = [];

   constructor(displayProperty: T) {
      this._displayProperty = displayProperty;
   }

   updateSearch(
      items: Array<SearchableItem<T>>,
      value: string,
      selectedItemId?: IFrontendControlNode['id']
   ): IResult {
      let id = selectedItemId;
      if (value) {
         this._searchResults = items.filter((element) =>
            element[this._displayProperty]
               .toLowerCase()
               .includes(value.toLowerCase())
         );

         if (this._searchResults.length > 0) {
            const selectedItemIndex = this._searchResults.findIndex(
               (element) => element.id === selectedItemId
            );

            this._lastFoundItemIndex =
               selectedItemIndex === -1 ? 0 : selectedItemIndex;
            id = this._searchResults[this._lastFoundItemIndex].id;
         }
      } else {
         id = undefined;
         this._searchResults = [];
         this._lastFoundItemIndex = 0;
      }

      return {
         id,
         index: this._lastFoundItemIndex,
         total: this._searchResults.length
      };
   }

   getNextItemId(value: string, shiftKey: boolean = false): IResult {
      if (!value || this._searchResults.length === 0) {
         return {
            id: undefined,
            index: 0,
            total: 0
         };
      }

      if (shiftKey) {
         if (this._lastFoundItemIndex === 0) {
            this._lastFoundItemIndex = this._searchResults.length - 1;
         } else {
            this._lastFoundItemIndex--;
         }
      } else {
         if (this._lastFoundItemIndex === this._searchResults.length - 1) {
            this._lastFoundItemIndex = 0;
         } else {
            this._lastFoundItemIndex++;
         }
      }

      return {
         id: this._searchResults[this._lastFoundItemIndex].id,
         index: this._lastFoundItemIndex,
         total: this._searchResults.length
      };
   }
}

export default Controller;
