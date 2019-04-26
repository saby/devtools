export interface ITemplateNode {
   id: number;
   name: string;
   type: Function;
   options?: object;
   attributes?: Record<string, string>;
   eventHandlers?: Record<string, Function>;
   parentId?: ITemplateNode['id'];
}

export interface IControlNode extends ITemplateNode {
   state?: object;
}
