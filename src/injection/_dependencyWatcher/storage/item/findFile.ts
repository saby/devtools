import { Bundles } from "Extension/Plugins/DependencyWatcher/EventData";

const findFile = (bundles: Bundles, module: string): string | void => {
    for (let fileName in bundles) {
        if (bundles[fileName].includes(module)) {
            return fileName;
        }
    }
};

export default findFile;
