export interface ITemplateNode {
   id: number;
   name: string;
   type: Function;
   options?: object;
   attributes?: object;
   eventHandlers?: Record<string, Function>;
   key?: string;
   parentId?: ITemplateNode['id'];
}

export interface IControlNode extends ITemplateNode {
   state?: object;
}
