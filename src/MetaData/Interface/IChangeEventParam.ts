import { IColumnMetaData } from "./IColumnMetaData";

export interface IChangeEventParam<TE = any, T = any> {
    column: IColumnMetaData<TE, T>;
    oldValue: T;
    newValue: T;
}
