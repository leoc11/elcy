import { ExpressionTransformer } from "../ExpressionTransformer";
import { ParameterExpression } from "./ParameterExpression";
import { IExpression } from "./IExpression";

export class SqlParameterExpression<T = any> extends ParameterExpression<T> {
    constructor(name: string, public readonly valueGetter: IExpression<T>) {
        super(name, valueGetter.type);
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return this.name;
    }
    public execute(transformer: ExpressionTransformer): any {
        return transformer.executeExpression(this);
    }
    public clone() {
        return new SqlParameterExpression(this.name, this.valueGetter);
    }
}
