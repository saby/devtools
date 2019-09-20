import { IDependencies } from 'Extension/Plugins/DependencyWatcher/IModule';
import { ListAbstract } from './ListAbstract';
import { ITransferRPCModule } from 'Extension/Plugins/DependencyWatcher/IRPCModule';

export class Dependent extends ListAbstract {
   protected _getChildren(item: ITransferRPCModule): IDependencies<number[]> {
      return item.dependent;
   }
}
