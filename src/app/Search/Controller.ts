import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';

interface IResult {
   id: IFrontendControlNode['id'];
   index: number;
   total: number;
}

class Controller {
   private _displayProperty: string = '';
   private _lastFoundItemIndex: number = 0;
   private _searchResults: object[] = [];

   constructor(displayProperty: string) {
      this._displayProperty = displayProperty;
   }

   updateSearch(
      items: object[],
      value: string,
      selectedItemId: IFrontendControlNode['id'] = NaN
   ): IResult {
      let id = selectedItemId;
      if (value) {
         this._searchResults = items.filter(
            (element) =>
               element[this._displayProperty]
                  .toLowerCase()
                  .indexOf(value.toLowerCase()) !== -1
         );

         if (this._searchResults.length > 0) {
            const selectedItemIndex = this._searchResults.findIndex(
               (element) => element.id === selectedItemId
            );

            if (selectedItemIndex !== this._lastFoundItemIndex) {
               this._lastFoundItemIndex =
                  selectedItemIndex === -1 ? 0 : selectedItemIndex;
               id = this._searchResults[this._lastFoundItemIndex].id;
            }
         }
      } else {
         id = NaN;
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
      if (value && this._searchResults.length > 0) {
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
      }

      return {
         id: this._searchResults[this._lastFoundItemIndex].id,
         index: this._lastFoundItemIndex,
         total: this._searchResults.length
      };
   }
}

export default Controller;
