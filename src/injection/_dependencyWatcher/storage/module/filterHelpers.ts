import { TYPESCRIPT_HELPERS_MODULE } from 'Extension/Plugins/DependencyWatcher/const';

function filterHelpers(module: string): boolean {
   return !TYPESCRIPT_HELPERS_MODULE.includes(module);
}

export default filterHelpers;
