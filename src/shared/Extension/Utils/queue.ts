interface PromiseConstruct<T> {
    (): Promise<T>;
}

/*
// До лучших времён, когда билдер научится в esnext
export let queue = async <T>(steps: PromiseConstruct<T>[]): Promise<T[]> => {
    let results: T[] = [];
    for (let step of steps) {
        results.push(await step());
    }
    return Promise.resolve(results);
};
*/

export let queue = async <T>(steps: PromiseConstruct<T>[]): Promise<T[]> => {
    let _steps = [...steps];
    let results: T[] = [];
    return new Promise((resolve) => {
        let fireStep = (): Promise<T | void> | void => {
            let step = _steps.shift();
            if (!step) {
                resolve(results);
                return;
            }
            return step().then((result: T) => {
                results.push(result);
                return fireStep();
            });
        };
        return fireStep();
    })
};
