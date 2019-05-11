import { FunctionExpression } from "./Expression/FunctionExpression";
import { LexicalAnalyzer } from "./LexicalAnalyzer";
import { SyntacticAnalyzer } from "./SyntacticAnalyzer";
import { IExpression } from "./Expression/IExpression";
import { GenericType } from "../Common/Type";

export class ExpressionBuilder {
    public static parse<T = any>(fn: (...items: any[]) => T, paramTypes?: GenericType[], userParameters?: { [key: string]: any }): FunctionExpression<T>;
    public static parse<T = any>(fn: string, paramTypes?: GenericType[], userParameters?: { [key: string]: any }): IExpression<T>;
    public static parse<T = any>(fn: ((...items: any[]) => T) | string | Function, paramTypes?: GenericType[], userParameters?: { [key: string]: any }) {
        const tokens = LexicalAnalyzer.parse(fn.toString());
        return SyntacticAnalyzer.parse(Array.from(tokens), paramTypes, userParameters);
    }
}