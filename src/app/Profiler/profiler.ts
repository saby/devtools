/**
 * Library of controls used on the "Profiler" tab.
 * @author Зайцев А.С.
 */
import domUnchanged = require('wml!Profiler/_Warning/templates/domUnchanged');
import invisible = require('wml!Profiler/_Warning/templates/invisible');
import unusedReceivedState = require('wml!Profiler/_Warning/templates/unusedReceivedState');
import asyncControl = require('wml!Profiler/_Warning/templates/asyncControl');

export { domUnchanged, invisible, unusedReceivedState, asyncControl };
export { default as Profiler } from './_Profiler/Profiler';
