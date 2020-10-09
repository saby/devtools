import { IBackendChangedReactiveProp } from 'Extension/Plugins/Elements/IProfilingData';

interface ITemplateNode {
   name: string;
   template: Function;
   containers?: IWasabyElement[];
   children: Array<ITemplateNode | IControlNode>;
   type: string | null;
   ref?: Function;
   options?: {
      [key: string]: unknown;
      content?: object;
   };
   changedOptions?: ITemplateNode['options'];
   attributes?: Record<string, string | boolean | number>;
   changedAttributes?: ITemplateNode['attributes'];
}

interface IWasabyHandlerFn extends Function {
   control: IControlNode['instance'];
}

interface IWasabyEventHandler {
   fn: IWasabyHandlerFn;
   args: unknown[];
   value: string;
   controlNode: IControlNode;
}

export interface IWasabyElement extends HTMLElement {
   eventProperties?: Record<string, IWasabyEventHandler[]>;
   controlNodes: IControlNode[];
}

interface IControlNode extends Exclude<ITemplateNode, 'children'> {
   markup: Array<ITemplateNode | IControlNode>;
   controlClass: Function;
   vnode: object;
   control: IControlNode['instance'];
   element: IWasabyElement;
   instance: {
      _container: IWasabyElement;
      _destroyed: boolean;
   } & { [handlerName: string]: Function };
   state?: object;
   context?: object;
   changedContext?: IControlNode['context'];
   changedReactiveProps?: string[] | IBackendChangedReactiveProp[];
}

export interface IBackendControlNode extends IControlNode {
   id: number;
   selfDuration: number;
   treeDuration: number;
   selfStartTime: number;
   lifecycleDuration: number;
   domChanged?: boolean;
   parentId?: IBackendControlNode['id'];
   logicParentId?: IBackendControlNode['id'];
   isVisible?: boolean;
   unusedReceivedState?: boolean;
   asyncControl?: boolean;
}

export interface IFrontendControlNode {
   id: IBackendControlNode['id'];
   name: IControlNode['name'];
   depth: number;
   class: string;
   parentId?: IBackendControlNode['parentId'];
   logicParentId?: IBackendControlNode['logicParentId'];
}

export interface ITemplateChanges {
   template: Function;
   options: object;
   logicParent: IControlNode['instance'] | null;
   changedOptions?: object;
   attributes: Record<string, string | number>;
   changedAttributes?: Record<string, string | number>;
   state: object;
}

export interface IControlChanges extends ITemplateChanges {
   instance: {
      _$resultBeforeMount?: Promise<unknown>;
   };
   context?: object;
   changedContext?: object;
}
