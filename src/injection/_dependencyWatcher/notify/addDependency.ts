import { broadcast } from "../broadcast";

export let addDependency = (
    module: string,
    dependency: string | Array<string>
) => {
    return broadcast.dispatch('addDependency', {
        module,
        dependency
    })
};
