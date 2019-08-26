export const merge = <
    TTarget extends object
    > (target: TTarget, source: Partial<TTarget>): boolean => {
    for (let key in source) {
        if (!source.hasOwnProperty(key)) {
            continue;
        }
        //@ts-ignore
        target[key] = source[key];
    }
    return true;
};
