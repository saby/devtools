import { FilterFunctionGetter } from 'Extension/Plugins/DependencyWatcher/data/filter/Filter';
import {
   IRPCModuleFilter,
   IRPCModuleInfo
} from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import { getForName } from 'Extension/Plugins/DependencyWatcher/data/filter/getForName';
import { getForFiles } from 'Extension/Plugins/DependencyWatcher/data/filter/getForFiles';
import ignoreWrap from 'Extension/Plugins/DependencyWatcher/data/filter/ignoreWrap';
import { css } from 'Extension/Plugins/DependencyWatcher/data/filter/css';
import { json } from 'Extension/Plugins/DependencyWatcher/data/filter/json';
import { i18n } from 'Extension/Plugins/DependencyWatcher/data/filter/i18n';
import { getDeprecated } from 'Extension/Plugins/DependencyWatcher/data/filter/getDeprecated';

const itemFilters: Partial<
   Record<keyof IRPCModuleFilter, FilterFunctionGetter<any, IRPCModuleInfo>>
> = {
   name: getForName,
   files: getForFiles,
   css: ignoreWrap(css),
   json: ignoreWrap(json),
   i18n: ignoreWrap(i18n),
   onlyDeprecated: getDeprecated
};

export default itemFilters;
