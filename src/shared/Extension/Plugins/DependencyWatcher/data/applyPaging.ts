export function applyPaging<TItems = unknown>(
   items: TItems[],
   offset: number = 0,
   limits?: number
): {
   data: TItems[];
   hasMore: boolean;
} {
   const len = items.length;
   const data = items.slice(offset, limits ? limits + offset : items.length);
   return {
      data,
      hasMore: len > data.length + offset
   };
}
