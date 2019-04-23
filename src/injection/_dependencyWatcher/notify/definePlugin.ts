import { devtoolChannel } from "../devtoolChannel";

export let definePlugin = (
    name: string
) => {
    return devtoolChannel.dispatch('definePlugin', {
        name,
    })
};
