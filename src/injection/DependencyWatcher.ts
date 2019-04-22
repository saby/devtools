import { define } from './_dependencyWatcher/define';
// import { require } from './_require/require'
import { DEFINE, REQUIRE } from "./_dependencyWatcher/const";
import { GLOBAL } from "./RENAME/const";
import { IPlugin } from "./IPlugin";
import { IConfig } from "./_dependencyWatcher/IConfig";
import { broadcast } from "./_dependencyWatcher/broadcast";

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
            broadcast.dispatch('error', error.message);
        }
    }
    static getName() {
        return 'DependencyWatcher'
    }
}
