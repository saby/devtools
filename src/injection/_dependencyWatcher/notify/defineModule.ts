import { devtoolChannel } from "../devtoolChannel";

export let defineModule = (
    module: string,
    dependency: Array<string> | undefined
) => {
    return devtoolChannel.dispatch('defineModule', {
        module,
        dependency
    })
};
