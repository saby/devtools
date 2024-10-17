import { FilterFunctionGetter } from './Filter';
import { getForName } from './getForName';
import { css } from './css';
import { json } from './json';
import { i18n } from './i18n';
import ignoreWrap from './ignoreWrap';
import {
   IModule,
   IModuleFilter
} from 'Extension/Plugins/DependencyWatcher/IModule';
import { dependentOnFiles } from './dependentOnFiles';
import { getDeprecated } from './getDeprecated';

const moduleFilters: Record<keyof IModuleFilter, FilterFunctionGetter<unknown, IModule>> = {
   name: getForName,
   css: ignoreWrap(css),
   json: ignoreWrap(json),
   i18n: ignoreWrap(i18n),
   dependentOnFiles,
   onlyDeprecated: getDeprecated
};

export default moduleFilters;
