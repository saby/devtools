import { define } from './_dependencyWatcher/define';
// import { require } from './_require/require'
import { DEFINE, REQUIRE } from "./_dependencyWatcher/const";
import { GLOBAL } from "./RENAME/const";
import { notify } from "./_dependencyWatcher/notify";
import { IPlugin } from "./IPlugin";
import { IConfig } from "./_dependencyWatcher/IConfig";

const DEFAULT: IConfig = {
    watchDynamicDependency: false
};

export class DependencyWatcher implements IPlugin {
    constructor(config: Partial<IConfig>) {
        const CONFIG: IConfig = {
            ...DEFAULT,
            ...config
        };
        try {
            Object.defineProperties(GLOBAL, {
                [DEFINE]: define(CONFIG),
                // [REQUIRE]: require(CONFIG)
            });
        } catch (error) {
            notify({
                method: 'reloadPage',
                error: error.message
            })
        }
    }
    static getName() {
        return 'DependencyWatcher'
    }
}
