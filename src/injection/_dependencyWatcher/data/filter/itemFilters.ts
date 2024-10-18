import { FilterFunctionGetter } from './Filter';
import {
   IRPCModuleFilter,
   IRPCModuleInfo
} from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import { getForName } from './getForName';
import ignoreWrap from './ignoreWrap';
import { css } from './css';
import { json } from './json';
import { i18n } from './i18n';
import { getDeprecated } from './getDeprecated';

const itemFilters: Partial<
   Record<keyof IRPCModuleFilter, FilterFunctionGetter<unknown, IRPCModuleInfo>>
> = {
   name: getForName,
   css: ignoreWrap(css),
   json: ignoreWrap(json),
   i18n: ignoreWrap(i18n),
   onlyDeprecated: getDeprecated
};

export default itemFilters;
