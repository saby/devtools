interface ITemplateNode {
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
   changedAttributes?: ITemplateNode['attributes'];
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
   eventProperties?: Record<string, IWasabyEventHandler[]>;
   controlNodes?: Array<{
      key: IControlNode['id'];
      id: string;
   }>;
}

interface IControlNode extends ITemplateNode {
   instance?: {
      _container: IWasabyElement;
      _destroyed: boolean;
   };
   state?: object;
}

export interface IBackendControlNode extends IControlNode {
   selfDuration: number;
   selfStartTime: number;
}

export interface IFrontendControlNode {
   id: IControlNode['id'];
   name: IControlNode['name'];
   depth: number;
   class: string;
   parentId?: IControlNode['parentId'];
}
