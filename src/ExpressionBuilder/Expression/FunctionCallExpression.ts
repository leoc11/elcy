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
    constructor(public readonly functionFn: ((...params: any[]) => TType), public readonly functionName: string, public params: IExpression[]) {
        super(); // TODO: must set specific type. must specify funtion => type map.
        try{
            this.type = functionFn("").constructor as any;
        }
        catch(e) {
            // TODO: map here.
        }
    }

    public toString(transformer: ExpressionTransformer): string {
        const paramStr = [];
        for (const param of this.params)
            paramStr.push(param.toString(transformer));
        return this.functionName + "(" + paramStr.join(", ") + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        const params = [];
        for (const param of this.params)
            params.push(param.execute(transformer));
        return this.functionFn.apply(null, params);
    }
}
