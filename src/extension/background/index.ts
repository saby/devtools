let setRequireConfig = (config) => {
    // @ts-ignore
    (require.config || window.require.config)(config);
};
setRequireConfig({
    baseUrl: '../',
    paths: {
        "tslib": "../ext/tslib"
    },
});
