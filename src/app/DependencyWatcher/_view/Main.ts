import * as Control from 'Core/Control';
import * as template from 'wml!DependencyWatcher/_view/Main';
import { Memory } from 'Types/source';

var srcData = [
    {
        id: 1,
        title: 'Czech Republic',
        parent: null,
        type: false
    },
    {
        id: 2,
        title: 'Prague',
        parent: 1,
        type: null
    },
    {
        id: 3,
        title: 'Brno',
        parent: 1,
        type: null
    },
    {
        id: 4,
        title: 'Russia',
        parent: null,
        type: true
    },
    {
        id: 5,
        title: 'Moscow region',
        parent: 4,
        type: false
    },
    {
        id: 6,
        title: 'Moscow',
        parent: 5,
        type: null
    },
    {
        id: 7,
        title: 'Balashiha',
        parent: 5,
        type: null
    },
    {
        id: 8,
        title: 'United Kingdom',
        parent: null,
        type: false
    },
    {
        id: 9,
        title: 'London',
        parent: 8,
        type: null
    },
    {
        id: 10,
        title: 'Indonesia',
        parent: null,
        type: false
    },
    {
        id: 11,
        title: 'Jakarta',
        parent: 10,
        type: null
    }
];
var myMemory = new Memory({
    data: srcData,
    idProperty: 'id'
});
var filterDepData = [
    {
        id: 'owner',
        resetValue: '0',
        value: '0',
        properties: {
            keyProperty: 'owner',
            displayProperty: 'title',
            source: new Memory({
                data: [
                    {id: 0, title: 'По ответственному', owner: '0'},
                    {id: 4, title: 'Чеперегин А.С.', owner: 'Чеперегин А.С.'}
                ],
                idProperty: 'id'
            })
        }
    },
    {
        id: 'department',
        resetValue: 'По департаменту',
        value: 'По департаменту',
        properties: {
            keyProperty: 'title',
            displayProperty: 'title',
            source: new Memory({
                data: [
                    {id: 0, title: 'По департаменту'},
                    {id: 7, title: 'Сопровождение информационных систем'}
                ],
                idProperty: 'id'
            })
        }
    }
];
var filterButtonData = [{
    id: 'owner',
    resetValue: '0',
    value: '0',
    source: new Memory({
        data: [
            {id: 0, title: 'По ответственному', owner: '0'},
            {id: 4, title: 'Чеперегин А.С.', owner: 'Чеперегин А.С.'}
        ],
        idProperty: 'id'
    })
}];

export default class Main extends Control {
    protected _template = template;
    private __source = myMemory;
    private __fastFilterSource =  filterDepData;
    private __items = filterButtonData;
    private __columns = [
        {
            displayProperty: 'title'
        }
    ];
    constructor(...args) {
        super(...args);
    }
}
