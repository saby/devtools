import { mixin } from 'Types/util';
import { Compatibility, ICompatibilityConfig } from './abstract/Compatibility';
import { QuerySource, IQueryConfig } from "./abstract/Query";

import {
    IFilterData,
    ListItem
} from "../types";

export interface ISourceConfig extends ICompatibilityConfig, IQueryConfig {

}

export abstract class Abstract<
    TTreeData extends ListItem = ListItem,
    TFilter extends IFilterData = IFilterData
>
    extends mixin<
        Compatibility,
        QuerySource
    >(Compatibility, QuerySource)
    implements Compatibility
{
    constructor(config: ISourceConfig) {
        super(config);
        Compatibility.call(this, config);
        //@ts-ignore
        QuerySource.call(this, config);
    }
}
