import { ExpressionTransformer } from "./ExpressionTransformer";
import { TransformerParameter } from "./TransformerParameter";
import { IExpression } from "./Expression/IExpression";
import { ParameterExpression } from "./Expression/ParameterExpression";

export class ValueExpressionTransformer extends ExpressionTransformer {
    constructor(params?: { [key: string]: any }) {
        super();
        if (params) {
            this.setParameters(params);
        }
    }
    public scopeParameters = new TransformerParameter();
    public setParameters(params: { [key: string]: any }) {
        for (const key in params) {
            this.scopeParameters.add(key.toString(), params[key]);
        }
    }
    public executeExpression(expression: IExpression): any {
        if (expression instanceof ParameterExpression) {
            return this.scopeParameters.get(expression.name);
        }
    }
}