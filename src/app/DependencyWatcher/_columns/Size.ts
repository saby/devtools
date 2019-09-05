import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_columns/Size';
import { Model } from 'Types/entity';
import 'css!DependencyWatcher/columns';

interface IOptions extends IControlOptions {
   itemData: {
      item: Model;
   };
}

enum Unit {
   Byte = 'B',
   KB = 'KB',
   MB = 'MB',
   GB = 'GB'
}

const STEP_SIZE = 1024;
const STEPS: Unit[] = [Unit.KB, Unit.MB, Unit.GB];
const ROUND = [100, 10];

export default class Size extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected _size: string;
   protected _unit: Unit;
   protected _beforeMount({ itemData }: IOptions): void {
      const size = itemData.item.get('size');
      if (!size) {
         return;
      }
      let _size: number = size;
      let _unit: Unit = Unit.Byte;
      for (const unit of STEPS) {
         if (_size < STEP_SIZE) {
            break;
         }
         _size = _size / STEP_SIZE;
         _unit = unit;
      }
      let fixedTo: number = 0;
      for (const round of ROUND) {
         if (_size >= round) {
            break;
         }
         fixedTo++;
      }
      this._unit = _unit;
      this._size = _size.toFixed(fixedTo);
   }
}
