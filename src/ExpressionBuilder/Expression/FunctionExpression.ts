import { GenericType } from "../../Common/Type";
import { ExpressionBuilder } from "../ExpressionBuilder";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";
import { ObjectValueExpression } from "./ObjectValueExpression";

export class FunctionExpression<TType = any, TResult = any> extends ExpressionBase<TResult> {
    public static Create<TType, TResult>(functionFn: ExpressionBase<TResult>, params: Array<ParameterExpression<TType>>): FunctionExpression<TType>;
    public static Create<TType, TResult>(functionFn: ((...params: any[]) => TResult), ctors: GenericType[]): FunctionExpression<TType>;
    public static Create<TType, TResult>(functionFn: ExpressionBase<TResult> | ((...params: any[]) => TResult), ctors: GenericType[] | Array<ParameterExpression<TType>>) {
        if (functionFn instanceof ExpressionBase)
            return new FunctionExpression(functionFn, ctors as Array<ParameterExpression<TType>>);

        return ExpressionBuilder.parse(functionFn, ctors as GenericType[]);
    }
    // TODO: type must always specified
    constructor(public body: IExpression<TResult>, public params: Array<ParameterExpression<TType>>, type?: GenericType<TResult>) {
        super(type);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        const params = [];
        for (const param of this.params)
            params.push(param.toString());

        if (this.body instanceof ObjectValueExpression)
            return "(" + params.join(", ") + ") => (" + this.body.toString(transformer) + ")";
        return "(" + params.join(", ") + ") => " + this.body.toString(transformer);
    }
    public execute(transformer: ExpressionTransformer): any {
        return transformer.executeExpression(this);
    }
    public clone() {
        return new FunctionExpression(this.body, this.params);
    }
}
