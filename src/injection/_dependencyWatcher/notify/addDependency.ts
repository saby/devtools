import { notify } from "../notify";

export let addDependency = (
    module: string,
    dependency: string | Array<string>
) => {
    return notify({
        method: 'addDependency',
        module,
        dependency
    })
};
