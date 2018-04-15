import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class FunctionCallExpression<TType> extends ExpressionBase<TType> {
    public static Create<TType>(functionFn: ((...params: any[]) => TType), params: IExpression[], functionName?: string) {
        if (typeof functionName !== "string")
            functionName = (functionFn as any).name;

        const result = new FunctionCallExpression<TType>(functionFn, functionName!, params);
        if (params.every((param) => param instanceof ValueExpression)) {
            return ValueExpression.create(result);
        }

        return result;
    }
    constructor(public readonly functionFn: ((...params: any[]) => TType), public readonly functionName: string, public params: IExpression[]) {
        super();
        switch (functionFn as any) {
            case parseInt:
            case parseFloat:
                this.type = Number as any;
                break;
            case decodeURI:
            case decodeURIComponent:
            case encodeURI:
            case encodeURIComponent:
                this.type = String as any;
                break;
            case isNaN:
            case isFinite:
                this.type = Boolean as any;
                break;
            case eval:
                this.type = Function as any;
                break;
            default:
                try { this.type = functionFn("").constructor as any; } catch (e) {}
        }
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        const paramStr = [];
        for (const param of this.params)
            paramStr.push(param.toString());
        return this.functionName + "(" + paramStr.join(", ") + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        const params = [];
        for (const param of this.params)
            params.push(param.execute(transformer));
        return this.functionFn.apply(null, params);
    }
    public clone() {
        return new FunctionCallExpression(this.functionFn, this.functionName, this.params);
    }
}
