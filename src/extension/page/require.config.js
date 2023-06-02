function setRequireConfig(config) {
    (require.config || window.require.config)(config);
}

setRequireConfig({
    baseUrl: '../',
    paths: {
        "tslib": "../ext/tslib",
        "Extension": [
            "../Extension"
        ],
    },
});
