// TODO: надо развести интерфейсы на фронте и в контент скрипте
export interface ITemplateNode {
   id: string;
   name: string;
   template: Function;
   container?: HTMLElement;
   options?: {
      [key: string]: unknown;
      content?: object;
   };
   changedOptions?: ITemplateNode['options'];
   attributes?: Record<string, string>;
   changedAttributes: ITemplateNode['attributes'];
   eventHandlers?: Record<
      string,
      Array<{ function: Function; arguments: unknown[] }>
   >;
   parentId?: ITemplateNode['id'];
}

interface IWasabyHandlerFn extends Function {
   control: Record<string, Function>;
}

interface IWasabyEventHandler {
   fn: IWasabyHandlerFn;
   args: unknown[];
   value: string;
}

export interface IWasabyElement extends HTMLElement {
   eventProperties: Record<string, IWasabyEventHandler[]>;
   controlNodes?: Array<{
      key: IControlNode['id'];
      id: string;
   }>;
}

export interface IControlNode extends ITemplateNode {
   instance?: {
      _container: IWasabyElement;
      _destroyed: boolean;
   };
   state?: object;
}
