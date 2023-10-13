/**
 * Contains interfaces and consts used to render warnings in the profiler.
 * @author Зайцев А.С.
 */

export interface IWarning {
   caption: string;
   template: string;
}

export type WARNING_NAMES =
   | 'domUnchanged'
   | 'invisible'
   | 'unusedReceivedState'
   | 'asyncControl'
   | 'manualForceUpdate';

export const WARNINGS: Record<WARNING_NAMES, IWarning> = {
   domUnchanged: {
      caption: 'Needless synchronization',
      template: 'Profiler/profiler:domUnchanged'
   },
   invisible: {
      caption: 'Invisible control',
      template: 'Profiler/profiler:invisible'
   },
   unusedReceivedState: {
      caption: 'Unused received state',
      template: 'Profiler/profiler:unusedReceivedState'
   },
   asyncControl: {
      caption: 'Async control',
      template: 'Profiler/profiler:asyncControl'
   },
   manualForceUpdate: {
      caption: 'Manual _forceUpdate',
      template: 'Profiler/profiler:manualForceUpdate'
   }
};
