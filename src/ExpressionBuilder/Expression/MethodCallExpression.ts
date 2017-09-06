import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class MethodCallExpression<TType, KProp extends keyof TType> implements ExpressionBase<any> {
    public static Create<TType, KProp extends keyof TType>(objectOperand: IExpression<TType>, methodName: KProp, params: IExpression[]) {
        const result = new MethodCallExpression(objectOperand, methodName, params);
        if (objectOperand instanceof ValueExpression && params.every((param) => param instanceof ValueExpression)) {
            return ValueExpression.Create<TType[KProp]>(result);
        }

        return result;
    }
    constructor(protected ObjectOperand: IExpression<TType>, protected MethodName: KProp, protected Params: IExpression[]) {
    }

    public ToString(): string {
        const paramStr = [];
        for (const param of this.Params)
            paramStr.push(param.ToString());
        return this.ObjectOperand.ToString() + "." + this.MethodName + "(" + paramStr.join(",") + ")";
    }
    public Execute() {
        const objectValue = this.ObjectOperand.Execute();
        const params = [];
        for (const param of this.Params)
            params.push(param.Execute());
        return objectValue[this.MethodName].apply(objectValue, params);
    }
}
