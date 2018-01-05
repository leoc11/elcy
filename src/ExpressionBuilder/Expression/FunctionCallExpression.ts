import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class FunctionCallExpression<TType> extends ExpressionBase<TType> {
    public static Create<TType>(functionFn: ((...params: any[]) => TType), params: IExpression[], functionName?: string) {
        if (typeof functionName !== "string")
            functionName = functionFn.name;

        const result = new FunctionCallExpression<TType>(functionFn, functionName, params);
        if (params.every((param) => param instanceof ValueExpression)) {
            return ValueExpression.Create(result);
        }

        return result;
    }
    constructor(protected FunctionFn: ((...params: any[]) => TType), protected FunctionName: string, protected Params: IExpression[]) {
        super(); // TODO: must set specific type. must specify funtion => type map.
    }

    public toString(transformer: ExpressionTransformer): string {
        const paramStr = [];
        for (const param of this.Params)
            paramStr.push(param.toString(transformer));
        return this.FunctionName + "(" + paramStr.join(", ") + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        const params = [];
        for (const param of this.Params)
            params.push(param.execute(transformer));
        return this.FunctionFn.apply(null, params);
    }
}
