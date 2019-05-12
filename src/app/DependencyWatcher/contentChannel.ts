import { ContentChannel } from "Devtool/Event/ContentChannel";
import { PLUGIN_NAME } from "Extension/Plugins/DependencyWatcher/const";

let contentChannel = new ContentChannel(PLUGIN_NAME);

export { contentChannel };
