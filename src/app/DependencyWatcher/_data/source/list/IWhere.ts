/**
 * Types for filters.
 * @author Зайцев А.С.
 */
export type IWhere<TFilter extends object> = Partial<TFilter> & {
   parent?: string | string[];
};

export type IWhereKey<TFilter extends object> = keyof IWhere<TFilter>;
