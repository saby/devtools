// @ts-ignore
import { ICrud } from 'Types/source';
import { mixin } from 'Types/util';
import { Compatibility, ICompatibilityConfig } from './abstract/Compatibility';
import { RPCSource, IRPCSourceConfig } from './abstract/RPC';
import { QuerySource, IQueryConfig } from "./abstract/Query";

import {
    IFilterData,
    ListItem
} from "../types";

export interface ISourceConfig extends ICompatibilityConfig, IRPCSourceConfig, IQueryConfig {

}

export abstract class Abstract<
    TTreeData extends ListItem = ListItem,
    TFilter extends IFilterData = IFilterData
>
    extends mixin<
        Compatibility,
        RPCSource,
        QuerySource
    >(Compatibility, RPCSource, QuerySource)
    implements ICrud, Compatibility
{
    constructor(config: ISourceConfig) {
        super(config);
        Compatibility.call(this, config);
        RPCSource.call(this, config);
        //@ts-ignore
        QuerySource.call(this, config);
    }
}
