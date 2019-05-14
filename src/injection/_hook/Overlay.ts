class Overlay {
   private overlay: HTMLElement;

   constructor() {
      const overlay = document.createElement('div');
      overlay.style.backgroundColor = 'rgba(0, 190, 210, 0.2)';
      overlay.style.position = 'absolute';
      overlay.style.zIndex = '100000000';
      overlay.style.pointerEvents = 'none';
      this.overlay = overlay;
   }

   inspect(container: Element): void {
      const { top, left, height, width }: ClientRect = container.getBoundingClientRect();
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
