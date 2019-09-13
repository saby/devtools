export function applyPaging<TItems = unknown>(
   items: TItems[],
   offset: number = 0,
   limits?: number
): {
   data: TItems[];
   hasMore: boolean;
} {
   const itemsLength = items.length;
   const data = items.slice(offset, limits ? limits + offset : itemsLength);
   return {
      data,
      hasMore: itemsLength > data.length + offset
   };
}
