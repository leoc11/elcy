import { ValueType } from "src/Common/Type";
import { IColumnMetaData } from "./IColumnMetaData";
import { IRelationMetaData } from "./IRelationMetaData";

export type IChangeEventParam<TMeta = any, T = unknown> = [metadata: TMeta, newValue: T, oldValue: T];
export type IColumnChangeEventParam<TE extends object = object, T = ValueType> = IChangeEventParam<IColumnMetaData<TE, T>, T>;
export type IRelationChangeEventParam<TE extends object = object, T extends object = object> = IChangeEventParam<IRelationMetaData<TE, T>, T[]>;

