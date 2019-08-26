import { IModule } from "Extension/Plugins/DependencyWatcher/IModule";

const addDynamic = (module: IModule, dependencies: IModule[]): IModule[] => {
    let withoutStatic = dependencies.filter((dependency: IModule) => {
        return !module.dependencies.static.has(dependency);
    });
    
    let withoutExisting = withoutStatic.filter((dependency: IModule) => {
        return !module.dependencies.dynamic.has(dependency);
    });
    
    withoutStatic.forEach((dependency: IModule) => {
        module.dependencies.dynamic.add(dependency);
        dependency.dependent.dynamic.add(module);
    });
    
    return withoutExisting;
};

export default addDynamic;
