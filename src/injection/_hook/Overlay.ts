import { isVisible } from './Utils';

interface IJQueryElement {
   0: HTMLElement;
   length: number;
}

function isJQueryElement(
   element: HTMLElement | IJQueryElement
): element is IJQueryElement {
   return element.hasOwnProperty('length');
}

const CAPTION_HEIGHT = 22;

function getVisibleChildren(element: HTMLElement): HTMLElement[] {
   return Array.prototype.filter.call(
      element.children,
      (child: HTMLElement) => {
         return isVisible(child);
      }
   );
}

/**
 * Returns the size of an element and its position relative to the viewport. Should be used when the element may have display: contents, but you still want to get its real size and position.
 * The function makes certain assumptions about the element if it has display: contents:
 * 1) The element is not a root element.
 * 2) The children of the element have the same height.
 * 3) The element doesn't have absolutely or stickily positioned children.
 * @param {HTMLElement} element
 * @returns {ClientRect}
 */
function getDimensions(element: HTMLElement): ClientRect {
   // TODO: смотреть на всех видимых детей, т.к. если они расположены горизонтально,
   //  то какой-то элемент посередине может распирать, да и вообще порядок может быть другим (привет, флексы и order)
   let dimensions: ClientRect = element.getBoundingClientRect();

   if (dimensions.width !== 0 || dimensions.height !== 0) {
      return dimensions;
   }

   const visibleChildren = getVisibleChildren(element);

   if (visibleChildren.length === 0) {
      return dimensions;
   }

   const firstChildDimensions = visibleChildren[0].getBoundingClientRect();
   const lastChildDimensions = visibleChildren[
      visibleChildren.length - 1
   ].getBoundingClientRect();

   dimensions = {
      width: lastChildDimensions.right - firstChildDimensions.left,
      height: firstChildDimensions.height,
      top: firstChildDimensions.top,
      right: lastChildDimensions.right,
      bottom: firstChildDimensions.bottom,
      left: firstChildDimensions.left
   };

   return dimensions;
}

function calculateCaptionPosition({
   top,
   bottom
}: {
   top: number;
   bottom: number;
}): {
   x: number;
   y: number;
} {
   // container is in viewport, caption is on top the container
   const result = {
      x: 0,
      y: -CAPTION_HEIGHT
   };
   const scrollTop = document.documentElement.offsetHeight;

   if (top > scrollTop) {
      // container is below the fold, caption on the bottom of the page
      result.y = scrollTop - top - CAPTION_HEIGHT;
   } else if (top < CAPTION_HEIGHT) {
      if (bottom > scrollTop - CAPTION_HEIGHT) {
         // container is above and below the fold simultaneously, caption should be on the top of the page
         result.y = 0;
      } else {
         // container is above the fold, caption should be on the bottom of the container
         result.y = bottom - top;
      }
   }

   return result;
}

/**
 * Module for managing overlay of an element on the page.
 * @author Зайцев А.С.
 */
class Overlay {
   private overlay: HTMLDivElement;
   private caption: HTMLSpanElement;

   constructor() {
      const overlay = document.createElement('div');
      overlay.style.backgroundColor = 'rgba(0, 190, 210, 0.2)';
      overlay.style.position = 'absolute';
      overlay.style.zIndex = '100000000';
      overlay.style.pointerEvents = 'none';
      overlay.style.whiteSpace = 'nowrap';

      const caption = document.createElement('span');
      caption.style.pointerEvents = 'none';
      caption.style.background = '#fff';
      caption.style.padding = '2px';
      caption.style.border = '1px solid #ccc';
      caption.style.boxSizing = 'border-box';
      caption.style.position = 'absolute';
      overlay.appendChild(caption);

      this.caption = caption;
      this.overlay = overlay;
   }

   inspect(
      container: HTMLElement | IJQueryElement,
      tooltipText: string = isJQueryElement(container)
         ? container[0].tagName.toLowerCase()
         : container.tagName.toLowerCase()
   ): void {
      const targetPosition = isJQueryElement(container)
         ? getDimensions(container[0])
         : getDimensions(container);
      this.draw(targetPosition, tooltipText);
   }

   inspectMultiple(
      containers: Array<HTMLElement | IJQueryElement>,
      tooltipText: string
   ): void {
      const docElement = document.documentElement;
      const targetPosition: {
         top: number;
         bottom: number;
         left: number;
         right: number;
      } = {
         top: docElement.clientHeight,
         bottom: 0,
         left: docElement.clientWidth,
         right: 0
      };
      containers.forEach((container) => {
         const element = isJQueryElement(container) ? container[0] : container;
         // skip invisible elements so they wouldn't set top and left to 0
         if (!isVisible(element)) {
            return;
         }
         const { top, bottom, left, right } = getDimensions(element);
         targetPosition.top = Math.min(targetPosition.top, top);
         targetPosition.bottom = Math.max(targetPosition.bottom, bottom);
         targetPosition.left = Math.min(targetPosition.left, left);
         targetPosition.right = Math.max(targetPosition.right, right);
      });
      this.draw(targetPosition, tooltipText);
   }

   remove(): void {
      this.overlay.remove();
   }

   private draw(
      targetPosition: {
         top: number;
         bottom: number;
         left: number;
         right: number;
      },
      tooltipText: string
   ): void {
      const captionPosition = calculateCaptionPosition(targetPosition);
      this.caption.style.left = `${captionPosition.x}px`;
      this.caption.style.top = `${captionPosition.y}px`;
      this.caption.textContent = tooltipText;
      this.overlay.style.top = `${targetPosition.top}px`;
      this.overlay.style.height = `${targetPosition.bottom -
         targetPosition.top}px`;
      this.overlay.style.width = `${targetPosition.right -
         targetPosition.left}px`;
      this.overlay.style.left = `${targetPosition.left}px`;
      document.body.appendChild(this.overlay);
   }
}

export default Overlay;
