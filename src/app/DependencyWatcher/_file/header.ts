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
const size: IHeader<ITransportFile> = {
   title: rk('size'),
   align: 'right',
   sortingProperty: 'size'
};

export const headers: IHeaders<ITransportFile> = [
   name,
   modules,
   size
];
