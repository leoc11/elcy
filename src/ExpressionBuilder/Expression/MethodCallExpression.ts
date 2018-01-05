import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class MethodCallExpression<TType, KProp extends keyof TType, TResult = any> extends ExpressionBase<TResult> {
    public static Create<TType, KProp extends keyof TType, TResult = any>(objectOperand: IExpression<TType>, params: IExpression[], methodName?: KProp, methodFn?: () => TResult) {
        const result = new MethodCallExpression(objectOperand, methodName ? methodName : methodFn!, params);
        if (objectOperand instanceof ValueExpression && params.every((param) => param instanceof ValueExpression)) {
            return ValueExpression.Create(result);
        }

        return result;
    }
    public MethodName: string;
    constructor(public ObjectOperand: IExpression<TType>, method: KProp | (() => TResult), public Params: IExpression[]) {
        super(); // TODO
        if (typeof method === "function") {
            this.MethodName = method.name;
        }
        else {
            this.MethodName = method;
        }
    }

    public toString(transformer: ExpressionTransformer): string {
        const paramStr = [];
        for (const param of this.Params)
            paramStr.push(param.toString(transformer));
        return this.ObjectOperand.toString(transformer) + "." + this.MethodName + "(" + paramStr.join(", ") + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        const objectValue = this.ObjectOperand.execute(transformer);
        const params = [];
        for (const param of this.Params)
            params.push(param.execute(transformer));
        return objectValue[this.MethodName].apply(objectValue, params);
    }
}
