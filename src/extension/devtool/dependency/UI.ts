

export let createUI = (modulesMap: Map<string, {
    dependencies: Array<string>;
    dynamicDependencies: Array<string>;
}>) => {
    document.querySelector('[name="showModule"]').addEventListener('click', () => {
        let modules = [];
        modulesMap.forEach((value, key) => {
            modules.push(key);
        });
        document.querySelector('.content').innerHTML = modules.join('<br/>');
    });
    
    document.querySelector('[name="showWithDeps"]').addEventListener('click', () => {
        let modules = [];
        modulesMap.forEach((value, key) => {
            modules.push(`
        <tr>
            <td>${ key }</td>
            <td>${ value.dependencies.join('<br/>') }</td>
            <td>${ value.dynamicDependencies.join('<br/>') }</td>
        </tr>
        `);
        });
        document.querySelector('.content').innerHTML = `
        <table>
            <tr>
                <th>module</th>
                <th>deps</th>
                <th>dynamic deps</th>
            </tr>
            ${modules.join('')}
        </table>
    `;
    });
};
