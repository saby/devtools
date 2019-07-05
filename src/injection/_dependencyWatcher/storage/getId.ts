let id: number = 1;

export let getId = (): number => {
    id++;
    return id;
};
