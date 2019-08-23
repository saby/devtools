import { source } from '../data';
//@ts-ignore
import { rk } from 'Core/i18n';

export interface FilterItem<TValue = unknown> {
    name: string;
    id?: string;
    textValue?: string;
    value: TValue;
    resetValue: TValue;
    visibility : boolean;
    viewMode: 'extended' | 'base';
    source?: any;
}
interface  FilterItemAdditional<TValue = unknown> extends FilterItem<TValue> {
    itemText: string,
    additionalText: string,
}

type FilterItems<T = unknown> = {
    '[Types/_entity/ICloneable]': true;
    clone(): FilterItems<T>;
} & FilterItem<T>[];

export const json: FilterItemAdditional<boolean> = {
    name: 'json',
    textValue: 'json!',
    itemText: rk('Файлы конфигурации'),
    additionalText: rk('Включая файлы конфигураций'),
    value: false,
    resetValue: false,
    visibility : false,
    viewMode: 'extended'
};
export const i18n: FilterItemAdditional<boolean> = {
    name: 'i18n',
    textValue: 'i18n!',
    itemText: rk('Файлы локализациии'),
    additionalText: rk('Включая файлы локализациий'),
    value: false,
    resetValue: false,
    visibility : false,
    viewMode: 'extended'
};
export const css: FilterItemAdditional<boolean> = {
    name: 'css',
    textValue: 'css!',
    itemText: rk('Файлы стилей'),
    additionalText: rk('Включая файлы стилей'),
    value: false,
    resetValue: false,
    visibility : false,
    viewMode: 'extended'
};

export const files: FilterItem<number[]> = {
    name: 'files',
    id: 'files',
    value: [],
    resetValue: [],
    visibility : true,
    viewMode: 'base'
};

export const dependentOnFiles: FilterItem<number[]> = {
    name: 'dependentOnFiles',
    id: 'dependentOnFiles',
    value: [],
    resetValue: [],
    visibility : true,
    viewMode: 'base'
};

export interface FilterItemConfig {
    fileSource: source.File;
}

export const getButtonSource = ({
    fileSource
}: Partial<FilterItemConfig>): FilterItem[] => {
    const result: FilterItem[] = [ json, css, i18n ];
    if (fileSource) {
        result.push({
            ...files,
            source: fileSource
        }, {
            ...dependentOnFiles,
            source: fileSource
        });
    }
    return result;
};
