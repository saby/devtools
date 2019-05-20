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
      container: HTMLElement,
      tooltipText: string = container.tagName
   ): void {
      const { top, left, height, width }: ClientRect = container.getBoundingClientRect();
      this.caption.textContent = tooltipText;
      this.overlay.style.top = `${top}px`;
      this.overlay.style.height = `${height}px`;
      this.overlay.style.width = `${width}px`;
      this.overlay.style.left = `${left}px`;
      document.body.appendChild(this.overlay);
   }

   remove(): void {
      if (this.overlay.parentNode) {
         this.overlay.parentNode.removeChild(this.overlay);
      }
   }
}

export default Overlay;
