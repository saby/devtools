export interface IFilterData extends Partial<{
    name: string;
    parent: string;
    fileId: number;
    dependentOnFile: number;
}> {

}
