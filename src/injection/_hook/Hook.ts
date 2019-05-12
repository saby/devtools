import { IWasabyDevHook } from './IHook';
import Store from './Store';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';

export class Hook implements IWasabyDevHook {
   private store: Store = new Store();

   onStartCommit(node: IControlNode): void {
      // TODO: тут нужно будет запоминать текущий рендерящийся контрол, возможно замерять время
   }

   onEndCommit(node: IControlNode, typeOfOperation: OperationType): void {
      this.store.handleOperation(typeOfOperation, node);
   }

   init(): void {
      // TODO: поменять цвет иконки, создать вкладку в дев тулзах, загрузить плагины, навесить всякие обработчики
   }
}
