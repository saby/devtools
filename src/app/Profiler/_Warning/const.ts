/**
 * Contains interfaces and consts used to render warnings in the profiler.
 * @author Зайцев А.С.
 */

export interface IWarning {
   caption: string;
   template: string;
}

export type WARNING_NAMES = 'domUnchanged' | 'invisible';

export const WARNINGS: Record<WARNING_NAMES, IWarning> = {
   domUnchanged: {
      caption: 'Needless synchronization',
      template: 'Profiler/profiler:domUnchanged'
   },
   invisible: {
      caption: 'Invisible control',
      template: 'Profiler/profiler:invisible'
   }
};
