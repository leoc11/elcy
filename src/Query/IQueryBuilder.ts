import { ICompleteColumnType } from "../Common/ICompleteColumnType";
import { ValueType } from "../Common/Type";
import { IQueryLimit } from "../Data/Interface/IQueryLimit";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { QueryExpression } from "../Queryable/QueryExpression/QueryExpression";
import { IQueryBuilderParameter } from "./IQueryBuilderParameter";
import { IQueryOption } from "./IQueryOption";
import { IQueryTemplate } from "./IQueryTemplate";
import { NamingStrategy } from "./NamingStrategy";

export interface IQueryBuilder {
    lastInsertIdQuery: string;
    namingStrategy: NamingStrategy;
    queryLimit: IQueryLimit;
    columnTypeString(columnType: ICompleteColumnType): string;
    // TODO: Remove
    newLine(indent?: number, isAdd?: boolean): string;
    toLogicalString(exp: IExpression<boolean>, param?: IQueryBuilderParameter): string;
    toOperandString(exp: IExpression, param?: IQueryBuilderParameter): string;
    toParameterValue(input: any, column: IColumnMetaData): any;
    toPropertyValue<T>(input: any, column: IColumnMetaData<any, T>): T;
    toQuery<T>(queryExp: QueryExpression<T>, option?: IQueryOption): IQueryTemplate[];
    valueColumnType(value: any): ICompleteColumnType;
    toString<T = any>(exp: IExpression<T>, param?: IQueryBuilderParameter): string;
    valueString(value: ValueType): string;
}
