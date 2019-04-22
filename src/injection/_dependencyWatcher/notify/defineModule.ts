import { broadcast } from "../broadcast";

export let defineModule = (
    module: string,
    dependency: Array<string> | undefined
) => {
    return broadcast.dispatch('defineModule', {
        module,
        dependency
    })
};
