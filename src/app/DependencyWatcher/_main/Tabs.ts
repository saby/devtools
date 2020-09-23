/**
 * Configs for different modes of the main list of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
import { ViewMode } from './ViewMode';
import { source } from '../data';
import { Memory } from 'Types/source';
import { IListConfig } from '../_data/source/IList';
import * as rk from 'i18n!DependencyWatcher';

interface IDescription {
   caption: string;
   title: string;
}

interface ITab extends IDescription {
   id: ViewMode;
}
interface ITabConfig extends IDescription {
   Source: new (cfg: IListConfig) => source.ListAbstract;
}

const dependencyTab: ITab = {
   id: ViewMode.dependency,
   caption: 'Dependency',
   title: rk('Зависимости модулей')
};

const dependentTab: ITab = {
   id: ViewMode.dependent,
   caption: 'Dependent',
   title: rk('Зависимые модули')
};

export const tabs = new Memory({
   data: [dependencyTab, dependentTab],
   keyProperty: 'id'
});

export function getTabConfig(mode: ViewMode): ITabConfig {
   switch (mode) {
      case ViewMode.dependency:
         return {
            ...dependencyTab,
            Source: source.Dependencies
         };
      case ViewMode.dependent:
         return {
            ...dependentTab,
            Source: source.Dependent
         };
   }
}
