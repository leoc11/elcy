import { GenericType } from "../Common/Type";
import { FunctionExpression } from "./Expression/FunctionExpression";
import { IExpression } from "./Expression/IExpression";
import { LexicalAnalyzer } from "./LexicalAnalyzer";
import { SyntacticAnalyzer } from "./SyntacticAnalyzer";

export class ExpressionBuilder {
    public static parse<T = unknown>(fn: (...items: unknown[]) => T, paramTypes?: GenericType[], userParameters?: { [key: string]: unknown }): FunctionExpression<T>;
    public static parse<T = unknown>(fn: string, paramTypes?: GenericType[], userParameters?: { [key: string]: unknown }): IExpression<T>;
    public static parse<T = unknown>(fn: ((...items: unknown[]) => T) | string, paramTypes?: GenericType[], userParameters?: { [key: string]: unknown }) {
        const tokens = LexicalAnalyzer.parse(fn.toString());
        return SyntacticAnalyzer.parse(Array.from(tokens), paramTypes, userParameters);
    }
}
