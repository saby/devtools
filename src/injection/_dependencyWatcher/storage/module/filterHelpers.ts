const HELPERS_MODULES = [
   'module',
   'require',
   'exports',
   'tslib'
];

/**
 * Filter function used to filter out helper functions added on build-step.
 * @author Зайцев А.С.
 */
function filterHelpers(moduleName: string): boolean {
   return !HELPERS_MODULES.includes(moduleName);
}

export default filterHelpers;
