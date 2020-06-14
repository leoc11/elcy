import { ParameterStack } from "../Common/ParameterStack";
import { GenericType } from "../Common/Type";
import { FunctionExpression } from "./Expression/FunctionExpression";
import { IExpression } from "./Expression/IExpression";
import { LexicalAnalyzer } from "./LexicalAnalyzer";
import { SyntacticAnalyzer } from "./SyntacticAnalyzer";

export class ExpressionBuilder {
    public static parse<T = any>(fn: (...items: any[]) => T, paramTypes?: GenericType[], userParameters?: { [key: string]: any } | ParameterStack): FunctionExpression<T>;
    public static parse<T = any>(fn: string, paramTypes?: GenericType[], userParameters?: { [key: string]: any } | ParameterStack): IExpression<T>;
    public static parse<T = any>(fn: ((...items: any[]) => T) | string | Function, paramTypes?: GenericType[], userParameters?: { [key: string]: any } | ParameterStack) {
        const tokens = LexicalAnalyzer.parse(fn.toString());
        if (!(userParameters instanceof ParameterStack)) {
            const parameterStack = new ParameterStack();
            parameterStack.set(userParameters);
            userParameters = parameterStack;
        }

        return SyntacticAnalyzer.parse(Array.from(tokens), paramTypes, userParameters as ParameterStack);
    }
}
