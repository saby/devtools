let id: number = 0;

export let getId = (): number => {
    id++;
    return id;
};
