import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { IQueryOption } from "./IQueryOption";
import { IQueryVisitContext } from "./IQueryVisitContext";
import { NamingStrategy } from "./NamingStrategy";
import { QueryTranslator } from "./QueryTranslator";

export interface IQueryVisitor {
    namingStrategy: NamingStrategy;
    parameterIndex: number;
    queryOption: IQueryOption;
    translator: QueryTranslator;

    // TODO: remove
    newAlias(type?: "entity" | "column" | "param"): string;
    setDefaultBehaviour<T extends object>(selectExp: SelectExpression<T>): void;
    setParameter(flatParameterStacks: { [key: string]: any }): void;
    visit<T>(exp: IExpression<T>, context: IQueryVisitContext): IExpression<T>;
    visitFunction<T, TArgs extends readonly unknown[]>(exp: FunctionExpression<T, TArgs>, parameters: { [K in keyof TArgs]: IExpression<TArgs[K]>; }, context: IQueryVisitContext): IExpression<T>;
}
