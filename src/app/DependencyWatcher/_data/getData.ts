type Module = {
    dependencies
    dynamicDependencies
}

const MODULES = new Map();
let isInspectedTab = (id) => {
    return chrome.devtools.inspectedWindow.tabId === id;
};

// type Request = chrome.;
type Sender = chrome.runtime.MessageSender;
type SendResponse = (response?: any) => void;

type Data = {
    method: string;
    module: string;
    dependency: Array<string>
}

type TabRequest = {
    type: string;
    module: string;
    data: Data;
}

let regModule = (name, deps) => {
    MODULES.set(name, {
        dependencies: deps || [],
        dynamicDependencies: []
    })
};

let addDependency = (name, deps) => {
    let module = MODULES.get(name);
    if (Array.isArray(deps)) {
        deps.forEach((dep) => {
            module.dynamicDependencies.push(dep);
        })
    } else {
        module.dynamicDependencies.push(deps);
    }
};

chrome.runtime.onMessage.addListener((
    request: TabRequest,
    sender: Sender,
    sendResponse: SendResponse
) => {
    if (!isInspectedTab(sender.tab.id)) {
        return;
    }
    if (request.module !== 'require') {
        return;
    }
    let data = request.data;
    if (data.method == 'defineModule') {
        regModule(data.module, data.dependency);
    }
    if (data.method == 'addDependency') {
        addDependency(data.module, data.dependency);
    }
});

let getData = () => {

};
