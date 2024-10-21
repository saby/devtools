export function applyPaging<TItems = unknown>(
   items: TItems[],
   offset: number,
   limit?: number
): {
   data: TItems[];
   hasMore: boolean;
} {
   const data = items.slice(offset, limit ? limit + offset : items.length);
   return {
      data,
      hasMore: items.length > data.length + offset
   };
}
