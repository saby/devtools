import { Memory } from 'Types/source';

let fastFilter = [
    {
        id: 'owner',
        resetValue: '0',
        value: '0',
        properties: {
            keyProperty: 'owner',
            displayProperty: 'title',
            source: new Memory({
                data:       [
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
                data:       [
                    {id: 0, title: 'По департаменту'},
                    {id: 7, title: 'Сопровождение информационных систем'}
                ],
                idProperty: 'id'
            })
        }
    }
];

export { fastFilter };
