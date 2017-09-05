import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class MethodCallExpression implements IExpression {
    public static Create(objectOperand: IExpression, methodName: string, params: IExpression[]): ValueExpression<any> | MethodCallExpression {
        if (objectOperand instanceof ValueExpression && params.every((param) => param instanceof ValueExpression)) {
            const objectValue = objectOperand.Execute();
            const paramStr = [];
            for (const param of params)
                paramStr.push(param.ToString());
            return new ValueExpression((objectValue[methodName]).apply(params), objectOperand.ToString() + "." + methodName + "(" + paramStr.join(",") + ")");
        }

        return new MethodCallExpression(objectOperand, methodName, params);
    }
    constructor(protected ObjectOperand: IExpression, protected MethodName: string, protected Params: IExpression[]) {
    }

    public ToString(): string {
        const paramStr = [];
        for (const param of this.Params)
            paramStr.push(param.ToString());
        return this.ObjectOperand.ToString() + "." + this.MethodName + "(" + paramStr.join(",") + ")";
    }
    public Execute() {
        const objectValue = this.ObjectOperand.Execute();
        return objectValue[this.MethodName].apply(objectValue, this.Params);
    }
}
