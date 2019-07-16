const getFileName = (path?: string): string => {
    if (!path) {
        return '';
    }
    return path.
        replace(/\?.+/, ''). // remove query
        replace(/#.+/, ''). // remove hash
        split(/\/|\\/).pop() // get last part of path
        || '';
};

export default getFileName;
