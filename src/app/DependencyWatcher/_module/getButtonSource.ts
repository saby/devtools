/**
 * Filter button source for the main list of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
import { source } from '../data';
import * as rk from 'i18n!DependencyWatcher';

export interface IFilterItem<TValue = unknown> {
   name: string;
   id?: string;
   textValue?: string;
   value: TValue;
   resetValue: TValue;
   visibility: boolean;
   viewMode: 'extended' | 'base';
   source?: source.File;
}
interface IFilterItemAdditional<TValue = unknown> extends IFilterItem<TValue> {
   itemText: string;
   additionalText: string;
}

type FilterItems<T = unknown> = {
   '[Types/_entity/ICloneable]': true;
   clone(): FilterItems<T>;
} & Array<IFilterItem<T>>;

const json: IFilterItemAdditional<boolean> = {
   name: 'json',
   textValue: 'json!',
   itemText: rk('Файлы конфигурации'),
   additionalText: rk('Включая файлы конфигураций'),
   value: false,
   resetValue: false,
   visibility: false,
   viewMode: 'extended'
};
const i18n: IFilterItemAdditional<boolean> = {
   name: 'i18n',
   textValue: 'i18n!',
   itemText: rk('Файлы локализации'),
   additionalText: rk('Включая файлы локализаций'),
   value: false,
   resetValue: false,
   visibility: false,
   viewMode: 'extended'
};
const css: IFilterItemAdditional<boolean> = {
   name: 'css',
   textValue: 'css!',
   itemText: rk('Файлы стилей'),
   additionalText: rk('Включая файлы стилей'),
   value: false,
   resetValue: false,
   visibility: false,
   viewMode: 'extended'
};

const onlyDeprecated: IFilterItemAdditional<boolean> = {
   name: 'onlyDeprecated',
   textValue: 'onlyDeprecated',
   itemText: rk('Только устаревшие модули'),
   additionalText: rk('Только устаревшие модули'),
   value: false,
   resetValue: false,
   visibility: false,
   viewMode: 'extended'
};

const files: IFilterItem<number[]> = {
   name: 'files',
   id: 'files',
   value: [],
   resetValue: [],
   visibility: true,
   viewMode: 'base',
   textValue: ''
};

const dependentOnFiles: IFilterItem<number[]> = {
   name: 'dependentOnFiles',
   id: 'dependentOnFiles',
   value: [],
   resetValue: [],
   visibility: true,
   viewMode: 'base',
   textValue: ''
};

interface IFilterItemConfig {
   fileSource: source.File;
}

export function getButtonSource({
   fileSource
}: IFilterItemConfig): IFilterItem[] {
   return [
      json,
      css,
      i18n,
      onlyDeprecated,
      {
         ...files,
         source: fileSource
      },
      {
         ...dependentOnFiles,
         source: fileSource
      }
   ];
}
