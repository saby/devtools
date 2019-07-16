import { FilterFunctionGetter } from "Extension/Plugins/DependencyWatcher/data/filter/Filter";
import { getForName } from "Extension/Plugins/DependencyWatcher/data/filter/getForName";
import { getForFileId } from "Extension/Plugins/DependencyWatcher/data/filter/getForFileId";
import { css } from "Extension/Plugins/DependencyWatcher/data/filter/css";
import { json } from "Extension/Plugins/DependencyWatcher/data/filter/json";
import { i18n } from "Extension/Plugins/DependencyWatcher/data/filter/i18n";
import ignoreWrap from "Extension/Plugins/DependencyWatcher/data/filter/ignoreWrap";

const moduleFilters: Record<string, FilterFunctionGetter<any>> = {
    name: <FilterFunctionGetter<string>> getForName,
    fileId: <FilterFunctionGetter<number>> getForFileId,
    css: <FilterFunctionGetter<boolean>> ignoreWrap(css),
    json: <FilterFunctionGetter<boolean>> ignoreWrap(json),
    i18n: <FilterFunctionGetter<boolean>> ignoreWrap(i18n),
};

export default moduleFilters;
