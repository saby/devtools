let getId = (() => {
    let id = 0;
    return () => {
        id++;
        return id;
    }
})();

export let add = (module: string): string => {
    return `{${ getId() }}${ module }`
};

export let remove = (module: string): string => {
    return module.replace(/\{\d*\}/, '');
};

const SPLITTER = ';';

type StringOrNumber = string | number;
export let serialize = <T extends StringOrNumber[] = StringOrNumber[]>(...args: T): string => {
    return [...args, getId()].join(SPLITTER);
};

export let deserialize = <T extends string[] = string[]>(item: string): T => {
    let result = item.split(SPLITTER);
    result.pop();
    return <T> result;
};
