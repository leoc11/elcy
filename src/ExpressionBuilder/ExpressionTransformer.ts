import { FunctionExpression, IExpression } from "./Expression";
import { TransformerParameter } from "./TransformerParameter";

export abstract class ExpressionTransformer {
    public scopeParameters: TransformerParameter;

    public executeExpression(expression: IExpression): any {
        if (expression instanceof FunctionExpression) {
            expression.body.execute(this);
        }
    }
    public getExpressionString(expression: IExpression): string {
        return "";
    }
}
