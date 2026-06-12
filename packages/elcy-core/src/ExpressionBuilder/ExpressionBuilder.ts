import { GenericType } from "../Common/Type";
import { FunctionExpression } from "./Expression/FunctionExpression";
import { IExpression } from "./Expression/IExpression";
import { LexicalAnalyzer } from "./LexicalAnalyzer";
import { SyntacticAnalyzer } from "./SyntacticAnalyzer";
import { LazyFunctionExpression } from "./Expression/LazyFunctionExpression";

export class ExpressionBuilder {
    public static parse<T = unknown, TArgs extends readonly unknown[] = []>(fn: (...items: TArgs) => T, paramTypes?: GenericType[], userParameters?: { [key: string]: unknown }): FunctionExpression<T, TArgs>;
    public static parse<T = unknown>(fn: string, paramTypes?: GenericType[], userParameters?: { [key: string]: unknown }): IExpression<T>;
    public static parse<T = unknown>(fn: ((...items: unknown[]) => T) | string, paramTypes?: GenericType[], userParameters?: { [key: string]: unknown }) {
        const tokens = LexicalAnalyzer.parse(fn.toString());
        return SyntacticAnalyzer.parse(Array.from(tokens), paramTypes, userParameters);
    }
}

export function $l<T, Targs extends readonly unknown[] = []>(fn: string, hashCode?: number): FunctionExpression<T, Targs> {
    return new LazyFunctionExpression<T, Targs>(fn, hashCode);
}

export function $c<T extends Function>(fn: T): T {
    return fn;
}