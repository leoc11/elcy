import { ExpressionBuilder } from "../ExpressionBuilder";
import { ExpressionBase, IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";

export class FunctionExpression<TType> implements ExpressionBase<TType> {
    public static Create<TType>(functionFn: ((...params: any[]) => TType)): FunctionExpression<TType>;
    public static Create<TType>(body: IExpression<TType>, params: Array<ParameterExpression<TType>>): FunctionExpression<TType>;
    public static Create<TType>(functionFn: IExpression<TType> | ((...params: any[]) => TType), params?: Array<ParameterExpression<TType>>) {
        if (typeof functionFn === "function")
            return (new ExpressionBuilder()).Parse(functionFn.toString());

        if (!params) {
            params = [];
        }

        return new FunctionExpression(functionFn, params);
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
