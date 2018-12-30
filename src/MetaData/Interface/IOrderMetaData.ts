import { OrderDirection } from "../../Common/Type";
import { IColumnMetaData } from "./IColumnMetaData";

export interface IOrderMetaData<TE = any> {
    column: IColumnMetaData<TE>;
    direction: OrderDirection;
}
