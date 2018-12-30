import { GenericType } from "../../Common/Type";
import { ExpressionBuilder } from "../ExpressionBuilder";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";
import { ObjectValueExpression } from "./ObjectValueExpression";
import { ValueExpressionTransformer } from "../ValueExpressionTransformer";
import { resolveClone } from "../../Helper/Util";

export class FunctionExpression<T = any> implements IExpression<T> {
    public static create<T>(functionFn: IExpression<T>, params: Array<ParameterExpression>): FunctionExpression<T>;
    public static create<T>(functionFn: ((...params: any[]) => T), ctors: GenericType[]): FunctionExpression<T>;
    public static create<T>(functionFn: IExpression<T> | ((...params: any[]) => T), ctors: GenericType[] | Array<ParameterExpression>) {
        if ((functionFn as IExpression).type)
            return new FunctionExpression(functionFn as IExpression, ctors as Array<ParameterExpression>);

        return ExpressionBuilder.parse(functionFn as any);
    }
    public type: GenericType<T>;
    public itemType?: GenericType;
    // TODO: type must always specified
    constructor(public body: IExpression<T>, public params: Array<ParameterExpression>, type?: GenericType<T>) { 
        this.type = type;
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
