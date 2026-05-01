
import { ColumnType } from "../../Common/ColumnType";
import { ColumnGeneration } from "../../Common/Enum";
import type { DbValue, GenericType, StringKeyOf, ValueType } from "../../Common/Type";
import { IColumnOption } from "../../Decorator/Option/IColumnOption";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { IEntityMetaData } from "./IEntityMetaData";

export type CustomDataMapper<T = ValueType, TDb = DbValue> = {
    persist: (value: T) => TDb;
    hydrate: (value: TDb) => T;
};

export interface IColumnMetaData<TE extends object = any, T = ValueType, TDb = DbValue> {
    charset?: string;
    collation?: string;
    columnName?: string;
    columnType?: ColumnType;
    defaultExp?: FunctionExpression<T>;
    description?: string;
    entity?: IEntityMetaData<TE>;
    generation?: ColumnGeneration;
    indexed?: boolean;
    isPrimaryColumn?: boolean;
    isProjected?: boolean;
    isReadOnly?: boolean;
    nullable?: boolean;
    propertyName?: StringKeyOf<TE>;
    type?: GenericType<T>;
    applyOption?(option: IColumnMetaData<TE, T, TDb> | IColumnOption<T, TDb>): void;

    customMapper?: CustomDataMapper<T, TDb>;
}
