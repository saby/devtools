import { TYPESCRIPT_HELPERS_MODULES } from 'Extension/Plugins/DependencyWatcher/const';

function filterHelpers(moduleName: string): boolean {
   return !TYPESCRIPT_HELPERS_MODULES.includes(moduleName);
}

export default filterHelpers;
