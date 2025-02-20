/**
 * Controller of the popup displayed by clicking on the extension icon.
 * @author Зайцев А.С.
 */
import Tab = chrome.tabs.Tab;

const selectFavoriteModules = document.getElementById(
    'selectFavoriteModules'
) as HTMLButtonElement;
const selectAllModules = document.getElementById(
    'selectAllModules'
) as HTMLButtonElement;
const resetAllModules = document.getElementById(
    'resetAllModules'
) as HTMLButtonElement;
const hotReloadPort = document.getElementById(
    'hotReloadPort'
) as HTMLInputElement;
const enableHotReload = document.getElementById(
    'enableHotReload'
) as HTMLButtonElement;
const disableHotReload = document.getElementById(
    'disableHotReload'
) as HTMLButtonElement;

selectFavoriteModules.addEventListener('click', () => {
    toggleFavoriteModules(true);
});

selectAllModules.addEventListener('click', () => {
    setCookie('s3debug', true, 'true');
});

resetAllModules.addEventListener('click', () => {
    setCookie('s3debug', true);
});

enableHotReload.addEventListener('click', () => {
    if (!hotReloadPort.checkValidity()) {
        toggleValidationElement(true);
        return;
    }
    toggleValidationElement(false);
    setCookie('s3HotReload', false, hotReloadPort.value);
});

disableHotReload.addEventListener('click', () => {
    toggleValidationElement(false);
    setCookie('s3HotReload', false);
});

async function getCurrentTab(): Promise<Tab> {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            resolve(tab);
        });
    });
}

async function getPinnedModules(): Promise<string> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(
            'debuggingPinnedModules',
            (result: { debuggingPinnedModules?: string[] }) => {
                resolve(result.debuggingPinnedModules?.join(',') ?? '');
            }
        );
    });
}

async function toggleFavoriteModules(state: boolean): Promise<void> {
    if (state) {
        const pinnedModules = await getPinnedModules();
        return setCookie('s3debug', true, pinnedModules);
    } else {
        return setCookie('s3debug', true);
    }
}

async function setCookie(
    name: string,
    forceReload: boolean,
    value?: string
): Promise<void> {
    const tab = await getCurrentTab();
    const url = new URL(tab.url as string).origin;
    const id = tab.id as number;
    if (value) {
        chrome.cookies.set(
            {
                name,
                url,
                value
            },
            () => {
                if (forceReload) {
                    chrome.tabs.reload(id);
                }
            }
        );
    } else {
        chrome.cookies.remove(
            {
                name,
                url
            },
            () => {
                if (forceReload) {
                    chrome.tabs.reload(id);
                }
            }
        );
    }
}

function toggleValidationElement(state: boolean): void {
    const element = document.querySelector('.validationError');
    if (element) {
        if (!state) {
            element.remove();
        }
    } else if (state) {
        const newElement = document.createElement('div');
        newElement.classList.add('validationError');
        newElement.textContent = 'Port should be a number between 1 and 65535.';
        hotReloadPort.insertAdjacentElement('afterend', newElement);
    }
}
