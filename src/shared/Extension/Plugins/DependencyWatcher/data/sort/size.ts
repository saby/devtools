import { SortFunction, SortResult } from "./Sort";

interface Size {
    size: number;
}

const size: SortFunction<Size> = <T extends Size>(first: T, second: T): SortResult => {
    let _first: number = first.size || 0;
    let _second: number = second.size || 0;

    return _first - _second;
};

export default size;
