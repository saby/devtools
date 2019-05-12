import { IEventEmitter, IHandler } from "Extension/Event/IEventEmitter";
import { AddDependency, DefineModule, RequireModule } from "Extension/Plugins/DependencyWatcher/EventData";
import { IModulesDependencyMap, IModuleDependency } from "Extension/Plugins/DependencyWatcher/Module";
import {
    EventNames,
    DependencyType,
    GLOBAL_MODULE_NAME,
} from 'Extension/Plugins/DependencyWatcher/const';

interface IConfig {
    channel: IEventEmitter;
}

/**
 * Компонент, отвечающий за сбор карты модулей и их зависимостей,
 * передаваемых по собитийному каналу из вкладки
 */
class ModuleCollector {
    private __defineModuleHandler: IHandler<DefineModule>;
    private __addDependencyHandler: IHandler<AddDependency>;
    private __requireHandler: IHandler<RequireModule>;
    private __channel: IEventEmitter;
    private readonly __modules: IModulesDependencyMap;
    private __depsCount: Map<string, number> = new Map();
    
    constructor({
        channel
    }: IConfig) {
        this.__channel = channel;
        this.__modules = new Map();
        this.__subscribe();
    }
    clear(): void {
        this.__modules.clear();
    }
    getAll(): IModulesDependencyMap {
        return this.__modules;
    }
    getUniques(): Set<string> {
        let uniques = new Set();
        this.__depsCount.forEach((count: number, module: string) => {
            if (count > 1) {
                return;
            }
            uniques.add(module);
        });
        return uniques;
    }
    destructor() {
        this.__unsubscribe();
    }
    private __subscribe(): void {
        this.__defineModuleHandler = this.__defineModule.bind(this);
        this.__addDependencyHandler = this.__addDependency.bind(this);
        this.__requireHandler = this.__require.bind(this);
        
        this.__channel.addListener(EventNames.addDependency, this.__addDependencyHandler);
        this.__channel.addListener(EventNames.defineModule, this.__defineModuleHandler);
        this.__channel.addListener(EventNames.require, this.__requireHandler);
    }
    private __unsubscribe(): void {
        this.__channel.removeListener(EventNames.addDependency, this.__addDependencyHandler);
        this.__channel.removeListener(EventNames.defineModule, this.__defineModuleHandler);
        this.__channel.removeListener(EventNames.require, this.__requireHandler);
        delete this.__defineModuleHandler;
        delete this.__addDependencyHandler;
        delete this.__requireHandler;
    }
    private __addDependency({ module, dependencies }: AddDependency): void {
        this.__addDependencies(
            module,
            Array.isArray(dependencies)? dependencies: [dependencies],
            DependencyType.dynamic
        );
    }
    private __defineModule({ module, dependencies = [] }: DefineModule): void {
        if (!module) {
            return this.__require({ dependencies });
        }
        this.__addDependencies(module, dependencies || [], DependencyType.static);
    }
    private __require({ dependencies }: RequireModule): void {
        this.__addDependencies(GLOBAL_MODULE_NAME, dependencies, DependencyType.dynamic);
    }
    private __getModule(name: string): IModuleDependency {
        if (this.__modules.has(name)) {
            return <IModuleDependency> this.__modules.get(name);
        }
        let module = {
            [DependencyType.static]: new Set(),
            [DependencyType.dynamic]: new Set()
        };
        this.__modules.set(name, module);
        this.__incrementCount(name);
        return module;
    }
    private __addDependencies(module: string, dependencies: string[], type: DependencyType) {
        let moduleDependencies = this.__getModule(module);
        dependencies.forEach((dependency) => {
            let name = dependency;
            this.__incrementCount(name);
            moduleDependencies[type].add(name);
        })
    }
    private __incrementCount(module: string) {
        let count: number = this.__depsCount.get(module) || 0;
        count++;
        this.__depsCount.set(module, count);
    }
}

export { ModuleCollector };
