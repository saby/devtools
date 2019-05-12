import { Method } from "Extension/Event/RPC";
import { moduleStorage } from "../moduleStorage";

export let hasNewModules: Method<boolean> = ({ count }) => {
    let modules = moduleStorage.getAll();
    return Object.keys(modules.static).length + Object.keys(modules.dynamic).length != count;
};
