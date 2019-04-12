import { notify } from "../notify";

export let defineModule = (
    module: string,
    dependency?: Array<string> | void
) => {
    return notify({
        method: 'defineModule',
        module,
        dependency
    })
};
