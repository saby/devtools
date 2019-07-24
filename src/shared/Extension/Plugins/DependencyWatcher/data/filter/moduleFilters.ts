import { FilterFunctionGetter } from "Extension/Plugins/DependencyWatcher/data/filter/Filter";
import { getForName } from "Extension/Plugins/DependencyWatcher/data/filter/getForName";
import { css } from "Extension/Plugins/DependencyWatcher/data/filter/css";
import { json } from "Extension/Plugins/DependencyWatcher/data/filter/json";
import { i18n } from "Extension/Plugins/DependencyWatcher/data/filter/i18n";
import ignoreWrap from "Extension/Plugins/DependencyWatcher/data/filter/ignoreWrap";
import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";
import { getForFile } from "Extension/Plugins/DependencyWatcher/data/filter/getForFile";

const moduleFilters: Record<string, FilterFunctionGetter<any, ModuleInfo>> = {
    name: getForName,
    file: getForFile,
    css: ignoreWrap(css),
    json: ignoreWrap(json),
    i18n: ignoreWrap(i18n),
};

export default moduleFilters;
