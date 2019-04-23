import * as Control from 'Core/Control';
import * as template from 'wml!DependencyWatcher/_view/Main';
import { fastFilter, filterButton, source } from "../data";
import { getColumns } from "./getColumns";
import { Mode } from "../Mode";
import { contentChannel } from "../contentChannel";

contentChannel.addListener('defineModule', (args) => {
    console.log('defineModule', args);
});
contentChannel.addListener('addDependency', (args) => {
    console.log('addDependency', args);
});

export default class Main extends Control {
    protected _template = template;
    private __source = source;
    private __fastFilterSource =  fastFilter;
    private __items = filterButton;
    private __columns = [
        {
            displayProperty: 'title'
        }
    ];
    constructor(...args) {
        super(...args);
    }
    private __getColumns() {
        return getColumns(Mode.dependency);
    }
}
