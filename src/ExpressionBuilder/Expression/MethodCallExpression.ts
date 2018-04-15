import { GenericType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class MethodCallExpression<TType, KProp extends keyof TType, TResult = any> extends ExpressionBase<TResult> {
    public static Create<TType, KProp extends keyof TType, TResult = any>(objectOperand: IExpression<TType>, params: IExpression[], methodName?: KProp, methodFn?: () => TResult) {
        const result = new MethodCallExpression(objectOperand, methodName ? methodName : methodFn!, params);
        if (objectOperand instanceof ValueExpression && params.every((param) => param instanceof ValueExpression)) {
            return ValueExpression.create(result);
        }

        return result;
    }
    public methodName: string;
    constructor(public objectOperand: IExpression<TType>, method: KProp | (() => TResult), public params: IExpression[], type?: GenericType<TResult>) {
        super(type);
        if (typeof method === "function") {
            this.methodName = method.name;
        }
        else {
            this.methodName = method;
        }
        // if type not defined, check type in runtime.
        if (!type && objectOperand.type) {
            try {
                this.type = objectOperand.type.prototype[this.methodName]().constructor;
            }
            catch (e) {
                this.type = Object;
            }
        }
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        const paramStr = [];
        for (const param of this.params)
            paramStr.push(param.toString());
        return this.objectOperand.toString() + "." + this.methodName + "(" + paramStr.join(", ") + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        const objectValue = this.objectOperand.execute(transformer);
        const params = [];
        for (const param of this.params)
            params.push(param.execute(transformer));
        return (objectValue as any)[this.methodName].apply(objectValue, params);
    }
    public clone() {
        return new MethodCallExpression(this.objectOperand, this.methodName as any, this.params, this.type);
    }
}
