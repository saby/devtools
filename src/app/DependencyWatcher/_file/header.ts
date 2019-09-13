// @ts-ignore
import { rk } from 'Core/i18n';
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import { IHeader, IHeaders } from '../interface/IHeaders';

const name: IHeader<ITransportFile> = {
   title: rk('name'),
   sortingProperty: 'name'
};
// TODO: разобраться что это вообще
const used: IHeader<ITransportFile> = {
   title: rk('used'),
   align: 'center',
   sortingProperty: 'used'
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
   // used,
   size
];
