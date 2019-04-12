export const GLOBAL = (function() {
    return this || (0, eval)('this');// eslint-disable-line no-eval
})();
