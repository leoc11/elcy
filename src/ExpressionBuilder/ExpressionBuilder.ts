import { GenericType } from "../Common/Type";
import { FunctionExpression } from "./Expression/FunctionExpression";
import { LexicalAnalyzer } from "./LexicalAnalyzer";
import { SyntacticAnalyzer } from "./SyntacticAnalyzer";

export class ExpressionBuilder {
    public static parse<TParam = any, TResult = any>(fn: (...items: TParam[]) => TResult, paramTypes?: GenericType<TParam>[], userParameters?: { [key: string]: any }) {
        const tokens = LexicalAnalyzer.parse(fn.toString());
        return SyntacticAnalyzer.parse(tokens, paramTypes, userParameters) as FunctionExpression<TParam, TResult>;
    }
}