import { IModule } from "Extension/Plugins/DependencyWatcher/IModule";

const addStatic = (module: IModule, dependencies: IModule[]): IModule[] => {
    let withoutExisting = dependencies.filter((dependency: IModule) => {
        return !module.dependencies.static.has(dependency);
    });
    withoutExisting.forEach((dependency: IModule) => {
        module.dependencies.static.add(dependency);
        dependency.dependent.static.add(module);
    });
    return withoutExisting;
};

export default addStatic;
