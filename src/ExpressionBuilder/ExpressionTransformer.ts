import { TransformerParameter } from "./TransformerParameter";
import { IExpression } from "./Expression/IExpression";
import { FunctionExpression } from "./Expression/FunctionExpression";

export abstract class ExpressionTransformer {
    public scopeParameters: TransformerParameter;

    public executeExpression<T>(expression: IExpression<T>): any {
        if (expression instanceof FunctionExpression) {
            expression.body.execute(this);
        }
    }
    public getExpressionString<T>(expression: IExpression<T>): string {
        return "";
    }
}
