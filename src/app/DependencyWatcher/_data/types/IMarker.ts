interface IMarkerIcon {
    icon?: string;
    title: string;
}

interface IMarkerClass {
    class?: string;
}

export interface IMarker extends IMarkerClass, IMarkerIcon {
    type: string
}
