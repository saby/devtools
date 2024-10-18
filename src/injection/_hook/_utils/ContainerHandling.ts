import Agent from '../Agent';
import {
   IBackendControlNode,
   IWasabyElement
} from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';

const refSymbol = Symbol('ref');
const oldContainerSymbol = Symbol('oldContainer');

interface IDevtoolsRef extends Function {
   [refSymbol]?: boolean;
   [oldContainerSymbol]?: IWasabyElement | null;
}

/**
 * Creates a function which will be used to catch node's container.
 */
export function getRef(
   idToContainers: Agent['idToContainers'],
   idToParentId: Agent['idToParentId'],
   domToIds: Agent['domToIds'],
   id: IBackendControlNode['id'],
   childRef?: IDevtoolsRef
): Function {
   if (childRef && childRef[refSymbol]) {
      return childRef;
   }
   const newRef: IDevtoolsRef = (element: IWasabyElement | null) => {
      if (childRef) {
         childRef(element);
      }
      updateContainer(
         idToContainers,
         idToParentId,
         domToIds,
         id,
         element,
         newRef[oldContainerSymbol]
      );
      newRef[oldContainerSymbol] = element;
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
 * Links container to id. Also bubbles the container to parents.
 * Bubbling is needed for templates which do not contain DOM-elements.
 * One assumption is made to make sure we don't end up with root having every element as its container:
 * all containers connected to the id have to be siblings.
 */
export function updateContainer(
   idToContainers: Agent['idToContainers'],
   idToParentId: Agent['idToParentId'],
   domToIds: Agent['domToIds'],
   id: IBackendControlNode['id'],
   newContainer: IWasabyElement | null,
   oldContainer?: IWasabyElement | null
): void {
   if (oldContainer === newContainer) {
      return;
   }

   const containers = idToContainers.get(id);

   const parentId = idToParentId.get(id);
   if (typeof parentId !== 'undefined') {
      updateContainer(
         idToContainers,
         idToParentId,
         domToIds,
         parentId,
         newContainer,
         oldContainer
      );
   }

   if (newContainer === null || containers) {
      removeContainer(id, domToIds, idToContainers, oldContainer);
   }

   if (newContainer) {
      addContainer(id, domToIds, idToContainers, newContainer);
   }
}

function addContainer(
   id: IBackendControlNode['id'],
   domToIds: Agent['domToIds'],
   idToContainers: Agent['idToContainers'],
   container: IWasabyElement
): void {
   const containers = idToContainers.get(id);
   if (containers) {
      if (containers.includes(container)) {
         /**
          * This branch is for the case when a container bubbles from a child to a parent-control,
          * and then the parent-control gets its own (the same) container.
          * It usually happens with the HOCs.
          */
         return;
      }
      if (containers[0].parentElement === container.parentElement) {
         containers.push(container);
      } else {
         const oldDepth = getElementDepth(containers[0]);
         const newDepth = getElementDepth(container);
         if (oldDepth < newDepth) {
            return;
         }
         if (oldDepth > newDepth) {
            // removeContainer mutates containers, so we have to make a copy
            containers.slice().forEach((oldContainer) => {
               removeContainer(id, domToIds, idToContainers, oldContainer);
            });
            idToContainers.set(id, [container]);
         } else {
            containers.push(container);
         }
      }
   } else {
      idToContainers.set(id, [container]);
   }
   updateDomToIds(domToIds, OperationType.CREATE, container, id);
}

function removeContainer(
   id: IBackendControlNode['id'],
   domToIds: Agent['domToIds'],
   idToContainers: Agent['idToContainers'],
   container?: IWasabyElement | null
): void {
   if (!container) {
      return;
   }

   updateDomToIds(domToIds, OperationType.DELETE, container, id);
   const containers = idToContainers.get(id);

   if (containers) {
      const oldIndex = containers.indexOf(container);
      if (oldIndex !== -1) {
         if (containers.length === 1) {
            idToContainers.delete(id);
         } else {
            containers.splice(oldIndex, 1);
         }
      }
   }
}

function getElementDepth(element: HTMLElement): number {
   let depth = 0;
   let parent = element.parentElement;
   while (parent) {
      depth++;
      parent = parent.parentElement;
   }

   return depth;
}
