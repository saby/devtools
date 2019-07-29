import { FilterFunctionGetter } from "Extension/Plugins/DependencyWatcher/data/filter/Filter";
import { getForName } from "Extension/Plugins/DependencyWatcher/data/filter/getForName";
import { css } from "Extension/Plugins/DependencyWatcher/data/filter/css";
import { json } from "Extension/Plugins/DependencyWatcher/data/filter/json";
import { i18n } from "Extension/Plugins/DependencyWatcher/data/filter/i18n";
import ignoreWrap from "Extension/Plugins/DependencyWatcher/data/filter/ignoreWrap";
import { IModule, IModuleFilter, ModuleInfo } from 'Extension/Plugins/DependencyWatcher/IModule';
import { getForFiles } from "Extension/Plugins/DependencyWatcher/data/filter/getForFiles";
import { dependentOnFiles } from 'Extension/Plugins/DependencyWatcher/data/filter/dependentOnFiles';

const moduleFilters: Partial<Record<keyof IModuleFilter, FilterFunctionGetter<any, IModule>>> = {
    name: getForName,
    files: getForFiles,
    css:  ignoreWrap(css),
    json: ignoreWrap(json),
    i18n: ignoreWrap(i18n),
    dependentOnFiles
};

export default moduleFilters;
