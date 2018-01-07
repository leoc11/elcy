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
    public methodName: string;
    constructor(public objectOperand: IExpression<TType>, method: KProp | (() => TResult), public params: IExpression[]) {
        super(); // TODO
        if (typeof method === "function") {
            this.methodName = method.name;
        }
        else {
            this.methodName = method;
        }
    }

    public toString(transformer: ExpressionTransformer): string {
        const paramStr = [];
        for (const param of this.params)
            paramStr.push(param.toString(transformer));
        return this.objectOperand.toString(transformer) + "." + this.methodName + "(" + paramStr.join(", ") + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        const objectValue = this.objectOperand.execute(transformer);
        const params = [];
        for (const param of this.params)
            params.push(param.execute(transformer));
        return objectValue[this.methodName].apply(objectValue, params);
    }
}
