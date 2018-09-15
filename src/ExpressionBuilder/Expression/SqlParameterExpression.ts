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
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const valueGetter = replaceMap.has(this.valueGetter) ? replaceMap.get(this.valueGetter) : this.valueGetter.clone(replaceMap);
        return new SqlParameterExpression(this.name, valueGetter);
    }
}
