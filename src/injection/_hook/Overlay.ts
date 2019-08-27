interface IJQueryElement {
   0: Element;
   length: number;
}

function isJQueryElement(
   element: Element | IJQueryElement
): element is IJQueryElement {
   return element.hasOwnProperty('length');
}

const CAPTION_HEIGHT = 22;

function calculateCaptionPosition({ top, height, bottom }: ClientRect): {
   x: number,
   y: number
} {
   const result = {
      x: 0,
      y: -CAPTION_HEIGHT
   };
   const scrollTop = document.documentElement.offsetHeight;

   if (top > scrollTop) {
      result.y = scrollTop - top - CAPTION_HEIGHT;
   } else if (top < CAPTION_HEIGHT) {
      if (bottom > scrollTop - CAPTION_HEIGHT) {
         result.y = 0;
      } else {
         result.y = height;
      }
   }

   return result;
}

class Overlay {
   private overlay: HTMLDivElement;
   private caption: HTMLSpanElement;

   constructor() {
      const overlay = document.createElement('div');
      overlay.style.backgroundColor = 'rgba(0, 190, 210, 0.2)';
      overlay.style.position = 'absolute';
      overlay.style.zIndex = '100000000';
      overlay.style.pointerEvents = 'none';

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
      container: Element | IJQueryElement,
      tooltipText: string = isJQueryElement(container)
         ? container[0].tagName.toLowerCase()
         : container.tagName.toLowerCase()
   ): void {
      const targetPosition = isJQueryElement(
         container
      )
         ? container[0].getBoundingClientRect()
         : container.getBoundingClientRect();
      const captionPosition = calculateCaptionPosition(targetPosition);
      this.caption.style.left = `${captionPosition.x}px`;
      this.caption.style.top = `${captionPosition.y}px`;
      this.caption.textContent = tooltipText;
      this.overlay.style.top = `${targetPosition.top}px`;
      this.overlay.style.height = `${targetPosition.height}px`;
      this.overlay.style.width = `${targetPosition.width}px`;
      this.overlay.style.left = `${targetPosition.left}px`;
      document.body.appendChild(this.overlay);
   }

   remove(): void {
      this.overlay.remove();
   }
}

export default Overlay;
