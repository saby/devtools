interface IResult {
   id: string;
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

   updateSearch(items: object[], value: string, selectedItemId?: string): IResult {
      const result = {
         id: '',
         index: 0,
         total: 0
      };
      if (value) {
         this._searchResults = items.filter(
            (element) =>
               element[this._displayProperty].toLowerCase().indexOf(value.toLowerCase()) !== -1
         );
         if (
            this._searchResults.length > 0 &&
            !this._searchResults.find(
               (element) => element.id === selectedItemId
            )
         ) {
            result.id = this._searchResults[0].id;
            this._lastFoundItemIndex = 0;
         }
      } else {
         this._searchResults = [];
         this._lastFoundItemIndex = 0;
      }
      result.total = this._searchResults.length;
      return result;
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
