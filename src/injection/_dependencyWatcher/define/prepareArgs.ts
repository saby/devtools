import { ArgsWithDependency, Args } from './IDefine'

let getName = (args: Array<any>): string | void => {
    if (typeof args[0] == 'string') {
        return args[0];
    }
};

let getDependencies = (args: Array<any>): string[] | void => {
    if (Array.isArray(args[0])) {
        return  args[0];
    }
    if (Array.isArray(args[1])) {
        return  args[1];
    }
};

let getConstructFunction = (args: Array<any>): Function | void => {
    for (let arg of args){
        if (typeof arg == 'function') {
            return arg;
        }
    }
};

export let prepareArgs = (args: Array<Args>) => {
    return {
        name: getName(args),
        dependencies: getDependencies(args),
        constructorFunction: getConstructFunction(args)
    }
};
