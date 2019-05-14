import { ViewMode } from "../const";

import { columns as listColumns } from './list/column';
import { columns as dependencyColumns } from './dependency/column';
import { columns as dependentColumns } from './dependent/column';

let getColumns = (mode: ViewMode) => {
    switch (mode) {
        case ViewMode.dependency: {
            return dependencyColumns;
        }
        case ViewMode.dependent: {
            return dependentColumns;
        }
        // case ViewMode.list: {
        //     return listColumns;
        // }
        default: {
            return listColumns;
        }
    }
};

export { getColumns };
