import { IMarker } from "./types";
// @ts-ignore
import { rk } from 'Core/i18n';

export let dynamic: IMarker = {
    title: rk('Динамическая зависимость модуля'),
};

export let notUsedBundleModule: IMarker = {
    title: rk('Данный модуль файла не используется в зависимом модуле')
};
