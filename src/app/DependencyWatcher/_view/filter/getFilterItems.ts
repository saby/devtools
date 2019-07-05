import { source } from 'DependencyWatcher/data';

interface FilterItem<TValue = unknown> {
    name: string;
    value: TValue;
    resetValue: TValue;
    visibility : boolean;
    viewMode: 'extended' | 'base';
    source?: any;
}
interface  FilterItemAdditional<TValue = unknown> extends FilterItem<TValue> {
    textValue: string,
    itemText: string,
    additionalText: string,
}

type FilterItems<T = unknown> = {
    '[Types/_entity/ICloneable]': true;
    clone(): FilterItems<T>;
} & FilterItem<T>[];

const json: FilterItemAdditional<boolean> = {
    name: 'json',
    textValue: 'json!',
    itemText: 'Файлы конфигурации',
    additionalText: 'Включая файлы конфигураций',
    value: false,
    resetValue: false,
    visibility : false,
    viewMode: 'extended'
};
const i18n: FilterItemAdditional<boolean> = {
    name: 'i18n',
    textValue: 'i18n!',
    itemText: 'Файлы локализациии',
    additionalText: 'Включая файлы локализациий',
    value: false,
    resetValue: false,
    visibility : false,
    viewMode: 'extended'
};
const css: FilterItemAdditional<boolean> = {
    name: 'css',
    textValue: 'css!',
    itemText: 'Файлы стилей',
    additionalText: 'Включая файлы стилей',
    value: false,
    resetValue: false,
    visibility : false,
    viewMode: 'extended'
};

const fileId: FilterItem = {
    name: 'fileId',
    // textValue: 'css!',
    // itemText: 'Файлы стилей',
    // additionalText: 'Включая файлы стилей',
    value: null,
    resetValue: null,
    visibility : false,
    viewMode: 'base'
};

export interface FilterItemConfig {
    fileSource: source.File;
}

export const getFilterItems = ({
   fileSource
}: Partial<FilterItemConfig>): FilterItem[] => {
    const result: FilterItem[] = [ json, css, i18n ];
    if (fileSource) {
        result.push({
            ...fileId,
            source: fileSource
        });
    }
    return result;
    // return Object.assign(result, {
    //     '[Types/_entity/ICloneable]': true,
    //     clone() {
    //         return result;
    //     }
    // });
};
