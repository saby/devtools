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
      this.__mouseOverHandler = this.__mouseOverHandler.bind(this);
      this.__clickHandler = this.__clickHandler.bind(this);
      this.__mouseDownHandler = this.__mouseDownHandler.bind(this);
      this.onSelect = options.onSelect;
   }

   startSelectingFromPage(): void {
      if (!this.overlay) {
         this.overlay = new Overlay();
      }
      this.subs = [
         this.__subscribe('mouseover', this.__mouseOverHandler),
         this.__subscribe('click', this.__clickHandler),
         this.__subscribe('mousedown', this.__mouseDownHandler)
      ];
   }

   stopSelectingFromPage(): void {
      if (this.overlay) {
         this.overlay.remove();
         this.overlay = undefined;
      }
      this.subs.forEach((unsubFunction) => {
         unsubFunction();
      });
   }

   highlightElement(containers?: IWasabyElement[], name?: string): void {
      if (!this.overlay) {
         this.overlay = new Overlay();
      }

      if (!containers) {
         this.overlay.remove();
         return;
      }
      // TODO: overloads should help to avoid type assertion but I can't get it to work properly(
      this.overlay.inspectMultiple(containers, name as string);
   }

   private __clickHandler(e: MouseEvent): void {
      e.stopPropagation();
      e.preventDefault();
      this.stopSelectingFromPage();
      this.onSelect(e.target as IWasabyElement);
   }

   private __mouseOverHandler(e: MouseEvent): void {
      (this.overlay as Overlay).inspect(e.target as IWasabyElement);
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
