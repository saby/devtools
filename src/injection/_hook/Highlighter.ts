import Overlay from './Overlay';
import { IWasabyElement } from 'Extension/Plugins/Elements/IControlNode';

interface IOptions {
   onSelect: (target: IWasabyElement) => void;
}

/**
 * Module for managing the highlightning of elements on a page. Can show and hide overlay on specific elements and track mouse to highlight the element under the cursor.
 * @author Зайцев А.С.
 */
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
      this.onSelect(e.target as IWasabyElement);
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
