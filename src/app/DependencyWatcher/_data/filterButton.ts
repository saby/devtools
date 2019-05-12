import { Memory } from 'Types/source';

let filterButton = [{
    id: 'owner',
    resetValue: '0',
    value: '0',
    source: new Memory({
        data:       [
            {id: 0, title: 'По ответственному', owner: '0'},
            {id: 4, title: 'Чеперегин А.С.', owner: 'Чеперегин А.С.'}
        ],
        idProperty: 'id'
    })
}];

export { filterButton }
