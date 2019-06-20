// TODO: надо развести интерфейсы на фронте и в контент скрипте
export interface ITemplateNode {
   id: string;
   name: string;
   template: Function;
   container?: HTMLElement;
   options?: object;
   changedOptions?: ITemplateNode['options'];
   attributes?: Record<string, string>;
   changedAttributes: ITemplateNode['attributes'];
   eventHandlers?: Record<
      string,
      Array<{ function: Function; arguments: unknown[] }>
   >;
   parentId?: ITemplateNode['id'];
}

export interface IControlNode extends ITemplateNode {
   instance?: object;
   state?: object;
}
