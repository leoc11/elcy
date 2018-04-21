import { ISqlParameterBuilderItem } from "./ISqlParameterBuilderItem";
import { ExpressionTransformer } from "../../ExpressionBuilder/ExpressionTransformer";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression";
import { TransformerParameter } from "../../ExpressionBuilder/TransformerParameter";

class ValueExpressionTransformer extends ExpressionTransformer {
    public scopeParameters = new TransformerParameter();
    public setParameters(params: { [key: string]: any }) {
        for (const key in params) {
            this.scopeParameters.add(key, params[key]);
        }
    }
    public executeExpression(expression: IExpression): any {
        if (expression instanceof ParameterExpression) {
            return this.scopeParameters.get(expression.name);
        }
    }
}
export class ParameterBuilder {
    constructor(protected readonly items: ISqlParameterBuilderItem[]) {

    }
    public getSqlParameters(params: { [key: string]: any }): Map<string, any> {
        const result = new Map<string, any>();
        const tranformer = new ValueExpressionTransformer();
        tranformer.setParameters(params);
        for (const param of this.items) {
            const value = param.valueGetter.execute(tranformer);
            result.set(param.name, value);
        }
        return result;
    }
}
