import Overlay from './Overlay';

interface IOptions {
   onSelect: (target: Element) => void;
}

class Highlighter {
   private readonly onSelect: IOptions['onSelect'];
   private subs: Array<() => void> = [];
   private overlay?: Overlay;

   constructor(options: IOptions) {
      this.onSelect = options.onSelect;
   }

   startSelectingFromPage(): void {
      if (!this.overlay) {
         this.overlay = new Overlay();
      }
      this.subs = [
         this.__subscribe('mouseover', this.__mouseOverHandler.bind(this)),
         this.__subscribe('click', this.__clickHandler.bind(this)),
         this.__subscribe('mousedown', this.__mouseDownHandler.bind(this))
      ];
   }

   stopSelectingFromPage(): void {
      if (this.overlay) {
         this.overlay.remove();
      }
      this.subs.forEach((unsubFunction) => {
         unsubFunction();
      });
   }

   highlightElement(container?: Element, name?: string): void {
      if (!this.overlay) {
         this.overlay = new Overlay();
      }

      if (!container) {
         this.overlay.remove();
         return;
      }
      this.overlay.inspect(container, name);
   }

   private __clickHandler(e: MouseEvent): void {
      e.stopPropagation();
      e.preventDefault();
      this.stopSelectingFromPage();
      this.onSelect(e.target as Element);
   }

   private __mouseOverHandler(e: MouseEvent): void {
      const element = document.elementFromPoint(e.x, e.y);
      if (element && this.overlay) {
         this.overlay.inspect(element);
      }
      e.stopPropagation();
      e.preventDefault();
   }

   private __mouseDownHandler(e: MouseEvent): void {
      e.stopPropagation();
      e.preventDefault();
   }

   private __subscribe<K extends keyof WindowEventMap>(
      eventName: K,
      callback: (this: Window, ev: WindowEventMap[K]) => void
   ): () => void {
      window.addEventListener(eventName, callback, true);
      return () => window.removeEventListener(eventName, callback, true);
   }
}

export default Highlighter;
