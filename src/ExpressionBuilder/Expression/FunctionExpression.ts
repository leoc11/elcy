import { ExpressionBuilder } from "../ExpressionBuilder";
import { ExpressionBase, IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";

export class FunctionExpression<TType = any> implements ExpressionBase<TType> {
    public static Create<TType>(functionFn: ExpressionBase, params: Array<ParameterExpression<TType>>): FunctionExpression<TType>;
    public static Create(functionString: string, ctors: Array<{ new(): any }>, params?: any[]): FunctionExpression<any>;
    public static Create<TType>(functionFn: ((...params: any[]) => TType), ctors: Array<{ new(): any }>, params?: any[]): FunctionExpression<TType>;
    public static Create<TType>(functionFn: string | ExpressionBase | ((...params: any[]) => TType), ctors: Array<{ new(): any }> | Array<ParameterExpression<TType>>, params?: any[]) {
        if (typeof functionFn === "function")
            functionFn = functionFn.toString();
        if (functionFn instanceof ExpressionBase)
            return new FunctionExpression(functionFn, ctors as Array<ParameterExpression<TType>>);

        return (new ExpressionBuilder()).ParseToExpression(functionFn, ctors as Array<{ new(): any }>, params);
    }
    constructor(public Body: IExpression<TType>, public Params: Array<ParameterExpression<any>>) {
    }

    public ToString(): string {
        const params = [];
        for (const param of this.Params)
            params.push(param.ToString());

        return "(" + params.join(", ") + ") => {" + this.Body.ToString() + "}";
    }
    public Execute() {
        throw new Error("Method not implemented.");
    }

}
