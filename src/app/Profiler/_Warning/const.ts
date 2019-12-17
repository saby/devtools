export interface IWarning {
   caption: string;
   template: string;
}

export type WARNING_NAMES = 'domUnchanged';

export const WARNINGS: Record<WARNING_NAMES, IWarning> = {
   domUnchanged: {
      caption: 'Unnecessary synchronization',
      template: 'Profiler/profiler:domUnchanged'
   }
};
