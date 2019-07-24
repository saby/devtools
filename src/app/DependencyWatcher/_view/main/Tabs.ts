import { ViewMode } from './ViewMode';
import { source } from '../../data';
import { Memory } from 'Types/source';
import { IListConfig } from '../../_data/source/IList';

interface IDescription {
    caption: string;
    title: string;
}

interface ITab extends IDescription {
    id: ViewMode;
}
interface TabConfig extends IDescription {
    Source: {
        new(cfg: IListConfig): source.ListAbstract
    }
}

const dependencyTab: ITab = {
    id: ViewMode.dependency,
    caption: 'Dependency',
    title: 'Зависимости модулей',
};

const dependentTab: ITab = {
    id: ViewMode.dependent,
    caption: 'Dependent',
    title: 'Зависимые модули',
};

export const tabs = new Memory({
    data: [ dependencyTab, dependentTab ],
    idProperty: 'id'
});

export const getTabConfig = (mode: ViewMode): TabConfig=> {
    if (mode == ViewMode.dependent) {
        return {
            ...dependentTab,
            Source: source.Dependent
        }
    }
    // if (mode == ViewMode.dependency) {
        return {
            ...dependencyTab,
            Source: source.Dependencies
        }
    // }
};
