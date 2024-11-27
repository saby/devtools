/**
 * Library of controls used on the "Profiler" tab.
 * @author Зайцев А.С.
 */
import * as domUnchanged from 'wml!Profiler/_Warning/templates/domUnchanged';
import * as invisible from 'wml!Profiler/_Warning/templates/invisible';
import * as unusedReceivedState from 'wml!Profiler/_Warning/templates/unusedReceivedState';
import * as asyncControl from 'wml!Profiler/_Warning/templates/asyncControl';
import * as manualForceUpdate from 'wml!Profiler/_Warning/templates/manualForceUpdate';

export {
   domUnchanged,
   invisible,
   unusedReceivedState,
   asyncControl,
   manualForceUpdate
};
export { default as Profiler } from './_Profiler/Profiler';
