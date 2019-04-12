import { notify } from "../notify";

export let definePlugin = (
    name: string
) => {
    return notify({
        method: 'definePlugin',
        name,
    })
};
