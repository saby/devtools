interface IJQueryElement {
   0: Element;
   length: number;
}

function isJQueryElement(
   element: Element | IJQueryElement
): element is IJQueryElement {
   return element.hasOwnProperty('length');
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
      const { top, left, height, width }: ClientRect = isJQueryElement(
         container
      )
         ? container[0].getBoundingClientRect()
         : container.getBoundingClientRect();
      this.caption.textContent = tooltipText;
      this.overlay.style.top = `${top}px`;
      this.overlay.style.height = `${height}px`;
      this.overlay.style.width = `${width}px`;
      this.overlay.style.left = `${left}px`;
      document.body.appendChild(this.overlay);
   }

   remove(): void {
      this.overlay.remove();
   }
}

export default Overlay;
