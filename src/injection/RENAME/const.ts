export { POST_MESSAGE_SOURCE } from "../../app/ExtensionCore/const"

export const GLOBAL = (function() {
    if (typeof self !== 'undefined') { return self }
    if (typeof window !== 'undefined') { return window }
    if (typeof global !== 'undefined') { return global }
    throw new Error('unable to locate global object');
})();

