import { NamingStrategy } from "../QueryBuilder/NamingStrategy";
import { QueryTranslator } from "../QueryBuilder/QueryTranslator/QueryTranslator";
import { ISelectQueryOption } from "../Queryable/QueryExpression/ISelectQueryOption";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { IQueryVisitParameter } from "./IQueryVisitParameter";
import { SqlParameterExpression } from "../ExpressionBuilder/Expression/SqlParameterExpression";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";

export interface IQueryVisitor {
    namingStrategy: NamingStrategy;
    translator: QueryTranslator;
    option: ISelectQueryOption;
    visit(expression: IExpression, param: IQueryVisitParameter): IExpression;
    visitFunction<T>(exp: FunctionExpression<T>, parameters: IExpression[], param: IQueryVisitParameter): IExpression;

    // TODO: remove
    sqlParameters: Map<string, SqlParameterExpression>;
    newAlias(type?: "entity" | "column" | "param"): string;
    setDefaultBehaviour<T>(selectExp: SelectExpression<T>): void;
    setParameter(flatParameterStacks: { [key: string]: any }, parameterStackIndex: number, parameter: { [key: string]: any }): void;
}