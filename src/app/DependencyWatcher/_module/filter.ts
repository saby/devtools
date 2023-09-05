/**
 * Library of controls used in the filter panel of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
import * as file from './filter/file';
import itemTemplate = require('wml!DependencyWatcher/_module/filter/itemTemplate');
import Panel = require('wml!DependencyWatcher/_module/filter/Panel');
import additionalTemplate = require('wml!DependencyWatcher/_module/filter/additionalTemplate');

export { file, itemTemplate, additionalTemplate, Panel };
