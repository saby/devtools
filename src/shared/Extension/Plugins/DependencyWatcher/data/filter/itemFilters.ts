import { FilterFunctionGetter } from "Extension/Plugins/DependencyWatcher/data/filter/Filter";
import { IItemFilter, IItemInfo } from 'Extension/Plugins/DependencyWatcher/IItem';
import { getForName } from 'Extension/Plugins/DependencyWatcher/data/filter/getForName';
import { getForFiles } from 'Extension/Plugins/DependencyWatcher/data/filter/getForFiles';
import ignoreWrap from 'Extension/Plugins/DependencyWatcher/data/filter/ignoreWrap';
import { css } from 'Extension/Plugins/DependencyWatcher/data/filter/css';
import { json } from 'Extension/Plugins/DependencyWatcher/data/filter/json';
import { i18n } from 'Extension/Plugins/DependencyWatcher/data/filter/i18n';


const itemFilters: Partial<Record<keyof IItemFilter, FilterFunctionGetter<any, IItemInfo>>> = {
    name: getForName,
    files: getForFiles,
    css:  ignoreWrap(css),
    json: ignoreWrap(json),
    i18n: ignoreWrap(i18n),
    // dependentOnFile
};

export default itemFilters;
