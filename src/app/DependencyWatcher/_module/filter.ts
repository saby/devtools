import * as file from './filter/file';
import itemTemplate = require('wml!DependencyWatcher/_module/filter/itemTemplate');
import Panel = require('wml!DependencyWatcher/_module/filter/Panel');
import additionalTemplate = require('wml!DependencyWatcher/_module/filter/additionalTemplate');
import 'css!DependencyWatcher/module';

export { file, itemTemplate, additionalTemplate, Panel };
