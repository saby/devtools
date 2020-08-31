/**
 * Headers for the list in the filter panel of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
import rk = require('i18n!DependencyWatcher/_file/header');
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import { IHeader, IHeaders } from '../interface/IHeaders';

const name: IHeader<ITransportFile> = {
   title: rk('name'),
   sortingProperty: 'name'
};
const modules: IHeader<ITransportFile> = {
   title: rk('modules'),
   align: 'center',
   sortingProperty: 'modules'
};

export const headers: IHeaders<ITransportFile> = [
   name,
   modules
];
