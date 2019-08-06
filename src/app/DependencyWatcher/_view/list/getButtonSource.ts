import { source } from 'app/DependencyWatcher/data';

export interface FilterItem<TValue = unknown> {
    name: string;
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
    itemText: 'Файлы конфигурации',
    additionalText: 'Включая файлы конфигураций',
    value: false,
    resetValue: false,
    visibility : false,
    viewMode: 'extended'
};
export const i18n: FilterItemAdditional<boolean> = {
    name: 'i18n',
    textValue: 'i18n!',
    itemText: 'Файлы локализациии',
    additionalText: 'Включая файлы локализациий',
    value: false,
    resetValue: false,
    visibility : false,
    viewMode: 'extended'
};
export const css: FilterItemAdditional<boolean> = {
    name: 'css',
    textValue: 'css!',
    itemText: 'Файлы стилей',
    additionalText: 'Включая файлы стилей',
    value: false,
    resetValue: false,
    visibility : false,
    viewMode: 'extended'
};

export const files: FilterItem<number[]> = {
    name: 'files',
    value: [],
    resetValue: [],
    visibility : true,
    viewMode: 'base'
};

export const dependentOnFiles: FilterItem<number[]> = {
    name: 'dependentOnFiles',
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
    // return result;
    return Object.assign(result, {
        '[Types/_entity/ICloneable]': true,
        clone() {
            return result;
        }
    });
};
