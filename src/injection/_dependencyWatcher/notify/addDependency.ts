import { devtoolChannel } from "../devtoolChannel";

export let addDependency = (
    module: string,
    dependency: string | Array<string>
) => {
    return devtoolChannel.dispatch('addDependency', {
        module,
        dependency
    })
};
