import { IModule } from "Extension/Plugins/DependencyWatcher/IModule";
import { getId } from "../getId";
import { GLOBAL_MODULE_NAME } from "Extension/Plugins/DependencyWatcher/const";

const create = (name: string): IModule => {
    const module: IModule = {
        name,
        defined: false,
        initialized: false,
        id: getId(),
        dependencies: {
            static:  new Set(),
            dynamic: new Set()
        },
        dependent: {
            static:  new Set(),
            dynamic: new Set()
        }
    };
    if (name == GLOBAL_MODULE_NAME) {
        module.defined = true;
        module.initialized = true;
    }
    return module;
};

export default create;
