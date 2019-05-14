import { IWasabyDevHook } from './IHook';
import Agent from './Agent';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';

export class Hook implements IWasabyDevHook {
   private agent: Agent = new Agent();

   onStartCommit(node: IControlNode): void {
      // TODO: тут нужно будет запоминать текущий рендерящийся контрол, возможно замерять время
   }

   onEndCommit(node: IControlNode, typeOfOperation: OperationType): void {
      this.agent.handleOperation(typeOfOperation, node);
   }

   init(): void {
      // TODO: поменять цвет иконки, создать вкладку в дев тулзах, загрузить плагины, навесить всякие обработчики
   }
}
