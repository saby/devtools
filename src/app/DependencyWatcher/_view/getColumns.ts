import { Mode } from "../Mode";

const LIST_COLUMNS = [
    {
        displayProperty: 'title'
    }
];

const DEPENDENT_COLUMNS = [

];

const DEPENDENCY_COLUMNS = [
    {
        displayProperty: 'title'
    }
];


let getColumns = (mode: Mode) => {
    switch (mode) {
        case Mode.dependency: {
            return DEPENDENCY_COLUMNS;
        }
        case Mode.dependent: {
            return DEPENDENT_COLUMNS;
        }
        case Mode.list: {
            return LIST_COLUMNS;
        }
        default: {
            return LIST_COLUMNS;
        }
    }
};

export { getColumns };
