import { FilterFunctionGetter } from "Extension/Plugins/DependencyWatcher/data/filter/Filter";
import { getForName } from "Extension/Plugins/DependencyWatcher/data/filter/getForName";
import { css } from "Extension/Plugins/DependencyWatcher/data/filter/css";
import { json } from "Extension/Plugins/DependencyWatcher/data/filter/json";
import { i18n } from "Extension/Plugins/DependencyWatcher/data/filter/i18n";
import ignoreWrap from "Extension/Plugins/DependencyWatcher/data/filter/ignoreWrap";
import { IModuleFilter, ModuleInfo } from 'Extension/Plugins/DependencyWatcher/IModule';
import { getForFiles } from "Extension/Plugins/DependencyWatcher/data/filter/getForFiles";

const moduleFilters: Partial<Record<keyof IModuleFilter, FilterFunctionGetter<any, ModuleInfo>>> = {
    name: getForName,
    files: getForFiles,
    css:  ignoreWrap(css),
    json: ignoreWrap(json),
    i18n: ignoreWrap(i18n),
};

export default moduleFilters;
