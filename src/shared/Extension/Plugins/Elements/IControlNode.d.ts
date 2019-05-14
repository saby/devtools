// TODO: надо развести интерфейсы на фронте и в контент скрипте
export interface ITemplateNode {
   id: string;
   name: string;
   template: Function;
   container?: HTMLElement;
   options?: object;
   attributes?: Record<string, string>;
   eventHandlers?: Record<string, Function>;
   parentId?: ITemplateNode['id'];
}

export interface IControlNode extends ITemplateNode {
   instance?: Function;
   state?: object;
}
