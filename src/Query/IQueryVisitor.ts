import { NamingStrategy } from "./NamingStrategy";
import { QueryTranslator } from "./QueryTranslator";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { IQueryVisitParameter } from "./IQueryVisitParameter";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IQueryOption } from "./IQueryOption";

export interface IQueryVisitor {
    namingStrategy: NamingStrategy;
    translator: QueryTranslator;
    option: IQueryOption;
    visit(expression: IExpression, param: IQueryVisitParameter): IExpression;
    visitFunction<T>(exp: FunctionExpression<T>, parameters: IExpression[], param: IQueryVisitParameter): IExpression;

    // TODO: remove
    newAlias(type?: "entity" | "column" | "param"): string;
    setDefaultBehaviour<T>(selectExp: SelectExpression<T>): void;
    setParameter(flatParameterStacks: { [key: string]: any }, parameterStackIndex: number): void;
}