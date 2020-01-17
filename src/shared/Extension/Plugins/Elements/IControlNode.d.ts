interface ITemplateNode {
   name: string;
   template: Function;
   container: IWasabyElement;
   children: Array<ITemplateNode | IControlNode>;
   type: string | null;
   ref?: Function;
   options?: {
      [key: string]: unknown;
      content?: object;
   };
   changedOptions?: ITemplateNode['options'];
   attributes?: Record<string, string>;
   changedAttributes?: ITemplateNode['attributes'];
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
      key: string;
      id: string;
   }>;
}

interface IControlNode extends Exclude<ITemplateNode, 'children'> {
   markup: Array<ITemplateNode | IControlNode>;
   controlClass: Function;
   vnode: object;
   instance?: {
      _container: IWasabyElement;
      _destroyed: boolean;
   };
   state?: object;
   context?: object;
   changedContext?: IControlNode['context'];
}

export interface IBackendControlNode extends IControlNode {
   id: number;
   selfDuration: number;
   treeDuration: number;
   selfStartTime: number;
   vNode: object;
   domChanged?: boolean;
   parentId?: IBackendControlNode['id'];
   isVisible?: boolean;
}

export interface IFrontendControlNode {
   id: IBackendControlNode['id'];
   name: IControlNode['name'];
   depth: number;
   class: string;
   parentId?: IBackendControlNode['parentId'];
}

export interface ITemplateChanges {
   template: Function;
   options: object;
   changedOptions?: object;
   attributes: Record<string, string | number>;
   changedAttributes?: Record<string, string | number>;
   state: object;
}

export interface IControlChanges extends ITemplateChanges {
   instance: object;
   context?: object;
   changedContext?: object;
}
