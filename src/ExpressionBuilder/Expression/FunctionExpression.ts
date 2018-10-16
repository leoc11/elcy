import { GenericType } from "../../Common/Type";
import { ExpressionBuilder } from "../ExpressionBuilder";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";
import { ObjectValueExpression } from "./ObjectValueExpression";
import { ValueExpressionTransformer } from "../ValueExpressionTransformer";
import { resolveClone } from "../../Helper/Util";

export class FunctionExpression<TType = any, TResult = any> extends ExpressionBase<TResult> {
    public static create<TType, TResult>(functionFn: ExpressionBase<TResult>, params: Array<ParameterExpression<TType>>): FunctionExpression<TType>;
    public static create<TType, TResult>(functionFn: ((...params: any[]) => TResult), ctors: GenericType[]): FunctionExpression<TType>;
    public static create<TType, TResult>(functionFn: ExpressionBase<TResult> | ((...params: any[]) => TResult), ctors: GenericType[] | Array<ParameterExpression<TType>>) {
        if (functionFn instanceof ExpressionBase)
            return new FunctionExpression(functionFn, ctors as Array<ParameterExpression<TType>>);

        return ExpressionBuilder.parse(functionFn);
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
    public execute(transformer?: ExpressionTransformer): any {
        if (!transformer)
            transformer = new ValueExpressionTransformer();
        return transformer.executeExpression(this);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const body = resolveClone(this.body, replaceMap);
        const params = this.params.select(o => resolveClone(o, replaceMap)).toArray();
        const clone = new FunctionExpression(body, params);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return this.body.hashCode();
    }
}
