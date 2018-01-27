import { FunctionExpression, IExpression } from "./Expression";
import { TransformerParameter } from "./TransformerParameter";

export abstract class ExpressionTransformer {
    public parameters: TransformerParameter;

    public executeExpression(expression: IExpression): any {
        if (expression instanceof FunctionExpression) {
            expression.body.execute(this);
        }
    }
    // tslint:disable-next-line:variable-name
    public getExpressionString(_expression: IExpression): string {
        return "";
    }
}
