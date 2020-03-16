/**
 * Contains utility functions used by agent.
 * @author Зайцев А.С.
 */
import { ControlType, OperationType } from 'Extension/Plugins/Elements/const';
import Agent from './Agent';
import {
   IBackendControlNode,
   IControlNode,
   ITemplateNode,
   IWasabyElement
} from 'Extension/Plugins/Elements/IControlNode';
import isDeepEqual from './isDeepEqual';

export function getControlType(node: IBackendControlNode): ControlType {
   if (node.instance) {
      return typeof node.options === 'object' && node.options.content
         ? ControlType.HOC
         : ControlType.CONTROL;
   }
   return ControlType.TEMPLATE;
}

export function getObjectDiff(
   obj1?: object,
   obj2?: object
): object | undefined {
   if (!obj1) {
      return obj2 ? obj2 : undefined;
   }
   if (!obj2) {
      return obj1;
   }
   const diff = Object.keys(obj1).reduce((result, key) => {
      if (!obj2.hasOwnProperty(key)) {
         result.push(key);
      } else if (!isDeepEqual(obj1[key], obj2[key])) {
         return result;
      } else {
         const resultKeyIndex = result.indexOf(key);
         result.splice(resultKeyIndex, 1);
      }
      return result;
   }, Object.keys(obj2));
   if (diff.length === 0) {
      return;
   } else {
      const resultDiff = {};
      diff.forEach((key) => {
         resultDiff[key] = obj2[key];
      });
      return resultDiff;
   }
}

export function isControlNode(node: object): node is IControlNode {
   return node.hasOwnProperty('controlClass');
}

export function isTemplateNode(node: object): node is ITemplateNode {
   return node.type === 'TemplateNode';
}

const refSymbol = Symbol('ref');

/**
 * Creates a function which will be used to catch node's container.
 * @param idToContainer
 * @param idToParentId
 * @param domToIds
 * @param id
 * @param childRef
 */
export function getRef(
   idToContainer: Agent['idToContainer'],
   idToParentId: Agent['idToParentId'],
   domToIds: Agent['domToIds'],
   id: IBackendControlNode['id'],
   childRef?: Function
): Function {
   if (childRef && childRef[refSymbol]) {
      return childRef;
   }
   const newRef = (element: IWasabyElement | null) => {
      if (childRef) {
         childRef(element);
      }
      updateContainer(
         idToContainer,
         idToParentId,
         domToIds,
         id,
         element,
         idToParentId.get(id)
      );
   };
   newRef[refSymbol] = true;
   return newRef;
}

function updateDomToIds(
   domToIds: Agent['domToIds'],
   operation: OperationType,
   dom: Element,
   id: IBackendControlNode['id']
): void {
   const ids = domToIds.get(dom);
   switch (operation) {
      case OperationType.DELETE:
         if (ids) {
            if (ids.length === 1) {
               domToIds.delete(dom);
            } else {
               const index = ids.indexOf(id);
               ids.splice(index, 1);
            }
         }
         break;
      case OperationType.CREATE:
         if (ids) {
            ids.push(id);
         } else {
            domToIds.set(dom, [id]);
         }
         break;
   }
}

/**
 * Links container to id. Also updates parent if it had the same container.
 * @param idToContainer
 * @param idToParentId
 * @param domToIds
 * @param id
 * @param newContainer
 */
export function updateContainer(
   idToContainer: Agent['idToContainer'],
   idToParentId: Agent['idToParentId'],
   domToIds: Agent['domToIds'],
   id: IBackendControlNode['id'],
   newContainer: IWasabyElement | null
): void {
   const oldContainer = idToContainer.get(id);
   if (oldContainer === newContainer) {
      return;
   }
   const parentId = idToParentId.get(id);
   if (typeof parentId !== 'undefined') {
      const parentContainer = idToContainer.get(parentId);
      if (!parentContainer || oldContainer === parentContainer) {
         updateContainer(
            idToContainer,
            idToParentId,
            domToIds,
            parentId,
            newContainer
         );
      }
   }
   if (oldContainer) {
      updateDomToIds(domToIds, OperationType.DELETE, oldContainer, id);
   }
   if (newContainer) {
      updateDomToIds(domToIds, OperationType.CREATE, newContainer, id);
      idToContainer.set(id, newContainer);
   } else {
      idToContainer.delete(id);
   }
}

function isParentVisible(element: HTMLElement): boolean {
   const parent = element.parentElement;
   if (parent) {
      return isVisible(parent);
   } else {
      return true;
   }
}

export function isVisible(element: HTMLElement): boolean {
   if (
      element === document.documentElement ||
      element === document.body ||
      element.offsetParent !== null
   ) {
      return true;
   }

   const style = getComputedStyle(element);
   if (style.position === 'fixed') {
      return style.display !== 'none' && isParentVisible(element);
   }
   if (style.display === 'contents') {
      return isParentVisible(element);
   }

   return false;
}

export function findControlByDomNode(
   element: Element,
   domToIds: Agent['domToIds'],
   elements: Agent['elements']
): IBackendControlNode | undefined {
   let currentElement: Node | null = element;

   while (currentElement) {
      const nodes = domToIds.get(currentElement);
      if (nodes) {
         return elements.get(nodes[nodes.length - 1]);
      }
      currentElement = currentElement.parentElement;
   }
   return;
}

function findControlNodeByInstance(
   instance: IControlNode['instance'],
   domToIds: Agent['domToIds'],
   elements: Agent['elements']
): IBackendControlNode | void {
   const container = instance._container[0]
      ? instance._container[0]
      : instance._container;
   const nodes = domToIds.get(container) as Array<IBackendControlNode['id']>;
   for (let i = 0; i < nodes.length; i++) {
      const currentNode = elements.get(nodes[i]);
      if (currentNode && currentNode.instance === instance) {
         return currentNode;
      }
   }
}

const EVENT_NAME_OFFSET = 3;

/**
 * For templates, returns every event handler. For controls, returns every event which is handled by this control.
 * Actually, not every event handled by the control is returned, only events for the control's container.
 * Devtools take information about events from the DOM elements, and there's no fast way to collect this information and keep it updated.
 * @param elements
 * @param id
 * @param domToIds
 * @param needControlNode
 */
export function getEvents(
   elements: Agent['elements'],
   domToIds: Agent['domToIds'],
   id: IBackendControlNode['id'],
   needControlNode?: false
): Record<string, Array<{ function: Function; arguments: unknown[] }>>;
export function getEvents(
   elements: Agent['elements'],
   domToIds: Agent['domToIds'],
   id: IBackendControlNode['id'],
   needControlNode?: true
): Record<
   string,
   Array<{
      function: Function;
      arguments: unknown[];
      controlNode: IBackendControlNode;
   }>
>;
export function getEvents(
   elements: Agent['elements'],
   domToIds: Agent['domToIds'],
   id: IBackendControlNode['id'],
   needControlNode: boolean = false
): ReturnType<typeof getEvents> {
   const node = elements.get(id);
   const events: ReturnType<typeof getEvents> = {};
   if (node && node.container.eventProperties) {
      const eventProperties = node.container.eventProperties;
      Object.keys(eventProperties).forEach((key) => {
         let properties = eventProperties[key];
         if (node.instance) {
            properties = properties.filter(
               (handler) => handler.fn.control === node.instance
            );
         }
         const result = properties.map((handler) => {
            const userHandler = handler.fn.control[handler.value];
            return {
               function: userHandler ? userHandler : handler.fn,
               arguments: handler.args,
               controlNode: needControlNode
                  ? findControlNodeByInstance(
                       handler.fn.control,
                       domToIds,
                       elements
                    )
                  : undefined
            };
         });
         if (result.length) {
            events[key.slice(EVENT_NAME_OFFSET)] = result;
         }
      });
   }
   return events;
}

/**
 * Constructs a condition for usage as a second argument to debug function.
 * @param name Name of the event.
 * @param id Id of a control to which method breakpoint will be added.
 */
export function getCondition(
   name: string,
   id: IBackendControlNode['id']
): string {
   const ctrl = `window.__WASABY_DEV_HOOK__._agent.elements.get(${id}).instance`;
   return `(arguments.length === 0 || arguments[0].type === "${name}") && (this === ${ctrl} || this.data === ${ctrl})`;
}
