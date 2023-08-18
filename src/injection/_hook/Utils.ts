/**
 * Contains utility functions used by agent.
 * @author Зайцев А.С.
 */
import { ControlType } from 'Extension/Plugins/Elements/const';
import Agent from './Agent';
import {
   IBackendControlNode,
   IControlNode,
   ITemplateNode
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
   instanceToId: Agent['instanceToId'],
   elements: Agent['elements']
): IBackendControlNode | void {
   const id = instanceToId.get(instance);
   if (typeof id !== 'undefined') {
      return elements.get(id);
   }
}

const EVENT_NAME_OFFSET = 3;

/**
 * For templates, returns every event handler. For controls, returns every event which is handled by this control.
 * Actually, not every event handled by the control is returned, only events for the control's container.
 * Devtools take information about events from the DOM elements, and there's no fast way to collect this information and keep it updated.
 * @param elements
 * @param id
 * @param instanceToId
 * @param needControlNode
 */
export function getEvents(
   elements: Agent['elements'],
   instanceToId: Agent['instanceToId'],
   id: IBackendControlNode['id'],
   needControlNode?: false
): Record<string, Array<{ function: Function; arguments: unknown[] }>>;
export function getEvents(
   elements: Agent['elements'],
   instanceToId: Agent['instanceToId'],
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
   instanceToId: Agent['instanceToId'],
   id: IBackendControlNode['id'],
   needControlNode: boolean = false
): ReturnType<typeof getEvents> {
   const node = elements.get(id);
   const events: ReturnType<typeof getEvents> = {};
   if (node && node.containers && node.containers[0].eventProperties) {
      const eventProperties = node.containers[0].eventProperties;
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
                       instanceToId,
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
