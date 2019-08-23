// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_module/column/Size';
import { Model } from 'Types/entity';

interface IConfig {
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
const STEPS: Unit[] = [
    Unit.KB,
    Unit.MB,
    Unit.GB
];
const ROUND = [ 100, 10 ];

export default class Size extends Control {
    protected _template = template;
    protected _reloadPage(): void {
        chrome.devtools.inspectedWindow.reload({});
    }
    protected _size: string;
    protected _unit: Unit;
    protected _beforeMount({ itemData }: IConfig) {
        const size = itemData.item.get('size');
        if (!size) {
            return;
        }
        let _size: number = size;
        let _unit: Unit = Unit.Byte;
        for (let unit of STEPS) {
            if (_size < STEP_SIZE) {
                break;
            }
            _size = _size / STEP_SIZE;
            _unit = unit;
        }
        let fixedTo: number = 0;
        for (let round of ROUND) {
            if (_size >= round) {
                break;
            }
            fixedTo++;
        }
        this._unit = _unit;
        this._size = _size.toFixed(fixedTo);
    }
}
