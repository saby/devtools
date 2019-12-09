export function highlightUpdate(
   node: HTMLElement
): void {
   node.style.transition = 'none';
   node.style.backgroundColor = '#881280';
   // force recalc
   // tslint:disable-next-line:no-unused-expression
   node.offsetTop;
   node.style.transition = 'background-color 1s ease';
   node.style.backgroundColor = 'transparent';
}
