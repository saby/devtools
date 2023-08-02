import { IDependencies } from 'Extension/Plugins/DependencyWatcher/IModule';
import { ListAbstract } from './ListAbstract';
import { ITransferRPCModule } from 'Extension/Plugins/DependencyWatcher/IRPCModule';

/**
 * Source for the "dependencies" mode.
 * @author Зайцев А.С.
 */
export class Dependencies extends ListAbstract {
   protected _getChildren(item: ITransferRPCModule): IDependencies<number[]> {
      return item.dependencies;
   }
}
