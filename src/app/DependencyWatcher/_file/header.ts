// @ts-ignore
import { rk } from 'Core/i18n';
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import { IHeader, IHeaders } from '../interface/IHeaders';

export const name: IHeader<ITransportFile> = {
    title: rk('name'),
    sortingProperty: "name"
};
export const used: IHeader<ITransportFile> = {
    title: rk('used'),
    align: 'center',
    sortingProperty: "used"
};
export const modules: IHeader<ITransportFile> = {
    title: rk('modules'),
    align: 'center',
    sortingProperty: "modules"
};
export const size: IHeader<ITransportFile> = {
    title: rk('size'),
    align: 'right',
    sortingProperty: "size"
};

export const headers: IHeaders<ITransportFile> = [
    name,
    modules,
    // used,
    size
];
