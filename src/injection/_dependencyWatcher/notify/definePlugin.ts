import { broadcast } from "../broadcast";

export let definePlugin = (
    name: string
) => {
    return broadcast.dispatch('definePlugin', {
        name,
    })
};
