
type IModule = {
    name: string;
    dependencies: IModule;
    dynamicDependencies: IModule;
}

type IFile = {
    modules: Array<IModule>;
    size: number;
    path: string;
}

type TreeData = {
    name: string;
    parent: string;
}
