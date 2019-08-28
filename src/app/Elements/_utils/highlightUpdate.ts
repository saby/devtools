export function highlightUpdate(
   node: HTMLElement,
   flashColor: string = '#881280',
   baseColor: string = 'transparent',
   duration: number = 1
): void {
   node.style.transition = 'none';
   node.style.backgroundColor = flashColor;
   // force recalc
   // tslint:disable-next-line:no-unused-expression
   node.offsetTop;
   node.style.transition = `background-color ${duration}s ease`;
   node.style.backgroundColor = baseColor;
}
