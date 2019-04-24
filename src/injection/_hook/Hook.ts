import { IWasabyDevHook } from './IHook';
import Store from './Store';
import { IControlNode } from '../../interface/IControlNode';
import { OperationType } from '../RENAME/const';

export class Hook implements IWasabyDevHook {
   private store: Store = new Store();

   constructor() {
      const data = {
         id: 1,
         name: 'Controls/List',
         type: () => 0,
         options: {
            string: 'test',
            number: 45674958,
            object: {
               objField: 1231,
               anotherOne: 1,
               andAnotherOne: {
                  andOneMore: '4534'
               },
               array: [1, '2', {
                  andOneMore: '4534'
               }]
            },
            func: () => 1
         }
      };
      this.store.handleOperation(OperationType.ADD, data);
   }

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
