import { FunctionExpression } from "./Expression/FunctionExpression";
import { LexicalAnalyzer } from "./LexicalAnalyzer";
import { SyntacticAnalyzer } from "./SyntacticAnalyzer";
import { IExpression } from "./Expression/IExpression";

export class ExpressionBuilder {
    public static parse<T = any>(fn: (...items: any[]) => T, userParameters?: { [key: string]: any }): FunctionExpression<T>;
    public static parse<T = any>(fn: string, userParameters?: { [key: string]: any }): IExpression<T>;
    public static parse<T = any>(fn: ((...items: any[]) => T) | string, userParameters?: { [key: string]: any }) {
        const tokens = LexicalAnalyzer.parse(fn.toString());
        return SyntacticAnalyzer.parse(tokens, userParameters);
    }
}