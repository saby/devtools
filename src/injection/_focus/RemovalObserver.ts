type RemovalCallback = (elem: Element) => void;

/**
 * Wrapper for a MutationObserver that only observes removals.
 * @author Зайцев А.С.
 */
export class RemovalObserver {
   private mutationObserver: MutationObserver;
   private observedElements: Map<Element, RemovalCallback> = new Map();

   constructor() {
      this.observerCallback = this.observerCallback.bind(this);
      this.mutationObserver = new MutationObserver(this.observerCallback);
   }

   observe(elem: Element, callback: RemovalCallback): void {
      if (this.observedElements.size === 0) {
         this.mutationObserver.observe(document.documentElement, {
            childList: true,
            subtree: true
         });
      }
      this.observedElements.set(elem, callback);
   }

   clearObservedElements(): void {
      this.mutationObserver.disconnect();
      this.observedElements.clear();
   }

   private observerCallback(): void {
      this.observedElements.forEach((callback, element) => {
         if (isDetached(element)) {
            callback(element);
            this.observedElements.delete(element);
         }
      });
   }
}

function isDetached(elem: Element): boolean {
   if (elem.parentElement === document.documentElement) {
      return false;
   } else if (elem.parentElement === null) {
      return true;
   } else {
      return isDetached(elem.parentElement);
   }
}
