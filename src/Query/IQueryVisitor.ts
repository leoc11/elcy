import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { IQueryOption } from "./IQueryOption";
import { IQueryVisitParameter } from "./IQueryVisitParameter";
import { NamingStrategy } from "./NamingStrategy";
import { QueryTranslator } from "./QueryTranslator";

export interface IQueryVisitor {
    namingStrategy: NamingStrategy;
    translator: QueryTranslator;
    parameterIndex: number;
    option: IQueryOption;
    visit(expression: IExpression, param: IQueryVisitParameter): IExpression;
    visitFunction<T>(exp: FunctionExpression<T>, parameters: IExpression[], param: IQueryVisitParameter): IExpression;

    // TODO: remove
    newAlias(type?: "entity" | "column" | "param"): string;
    setDefaultBehaviour<T>(selectExp: SelectExpression<T>): void;
    setParameter(flatParameterStacks: { [key: string]: any }): void;
}
