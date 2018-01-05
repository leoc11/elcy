import { genericType } from "../../Common/Type";
import { ExpressionBuilder } from "../ExpressionBuilder";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";

export class FunctionExpression<TType = any, TResult = any> extends ExpressionBase<TResult> {
    public static Create<TType, TResult>(functionFn: ExpressionBase<TResult>, params: Array<ParameterExpression<TType>>): FunctionExpression<TType>;
    public static Create(functionString: string, ctors: Array<{ new(): any }>, params?: any[]): FunctionExpression<any>;
    public static Create<TType, TResult>(functionFn: ((...params: any[]) => TResult), ctors: Array<{ new(): any }>, params?: any[]): FunctionExpression<TType>;
    public static Create<TType, TResult>(functionFn: string | ExpressionBase<TResult> | ((...params: any[]) => TResult), ctors: Array<{ new(): any }> | Array<ParameterExpression<TType>>, params?: any[]) {
        if (typeof functionFn === "function")
            functionFn = functionFn.toString();
        if (functionFn instanceof ExpressionBase)
            return new FunctionExpression(functionFn, ctors as Array<ParameterExpression<TType>>);

        return (new ExpressionBuilder()).ParseToExpression(functionFn, ctors as Array<{ new(): any }>, params);
    }
    // TODO: type must always specified
    constructor(public Body: IExpression<TResult>, public Params: Array<ParameterExpression<TType>>, type?: genericType<TResult>) {
        super(type);
    }

    public toString(transformer: ExpressionTransformer): string {
        const params = [];
        for (const param of this.Params)
            params.push(param.toString());

        return "(" + params.join(", ") + ") => {" + this.Body.toString(transformer) + "}";
    }
    public execute(transformer: ExpressionTransformer): TResult {
        throw new Error("Method not implemented.");
    }

}
