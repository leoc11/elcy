import { FunctionExpression } from "./Expression/FunctionExpression";
import { LexicalAnalyzer } from "./LexicalAnalyzer";
import { SyntacticAnalyzer } from "./SyntacticAnalyzer";

export class ExpressionBuilder {
    public static parse<TParam = any, TResult = any>(fn: (...items: TParam[]) => TResult, userParameters?: { [key: string]: any }) {
        const tokens = LexicalAnalyzer.parse(fn.toString());
        return SyntacticAnalyzer.parse(tokens, userParameters) as FunctionExpression<TParam, TResult>;
    }
}