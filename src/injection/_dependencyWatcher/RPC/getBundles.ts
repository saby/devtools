import { Method } from "Extension/Event/RPC";
import { Bundles } from "Extension/Plugins/DependencyWatcher/EventData";
import { GLOBAL } from "../../const";

let fromRequireConfig = (): Bundles | void => {
    try {
        // @ts-ignore
        return require.s.contexts._.config.bundles;
    }
    catch (error) {
        return ;
    }
};

let fromGlobal = (): Bundles | void => {
    return GLOBAL.bundles;
};

export let getBundles: Method<Bundles> = () => {
    return fromGlobal() ||
    fromRequireConfig()
    || {}
};
