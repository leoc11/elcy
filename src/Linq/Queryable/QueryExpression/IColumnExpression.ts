import { GenericType } from "../../../Common/Type";
import { IEntityExpression } from "./IEntityExpression";
import { IQueryExpression } from "./IQueryExpression";

export interface IColumnExpression<TE = any, T = any> extends IQueryExpression<T> {
    type: GenericType<T>;
    alias?: string;
    dbType: string;
    entity: IEntityExpression<TE>;
    property: string;
    isPrimary: boolean;
    isShadow?: boolean;
    clone(): IColumnExpression<TE, T>;
}
