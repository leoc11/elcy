import { TransformerParameter } from "./TransformerParameter";
import { IExpression } from "./Expression/IExpression";
import { FunctionExpression } from "./Expression/FunctionExpression";

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
