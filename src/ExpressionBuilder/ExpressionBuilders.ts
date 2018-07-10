import { GenericType } from "../Common/Type";
import { FunctionExpression } from "./Expression/FunctionExpression";
import { LexicalAnalizer } from "./LexicalAnalizer";
import { SyntacticAnalizer } from "./SyntacticAnalizer";

export class ExpressionBuilder {
    public static parse<TParam = any, TResult = any>(fn: (...items: TParam[]) => TResult, paramTypes?: GenericType<TParam>[], userParameters?: { [key: string]: any }) {
        const tokens = LexicalAnalizer.parse(fn.toString());
        return SyntacticAnalizer.parse(tokens, paramTypes, userParameters) as FunctionExpression<TParam, TResult>;
    }
}