import { GenericType, IObjectType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
export interface IExpression<T = any> {
    type: GenericType<T>;
    objectType?: GenericType<any>;
    toString(transformer?: ExpressionTransformer): string;
    execute(transformer?: ExpressionTransformer): T;
    clone(): IExpression<T>;
}

export abstract class ExpressionBase<T = any> implements IExpression<T> {
    public type: GenericType<T>;
    public objectType: GenericType<any>;
    constructor(type?: GenericType<T>) {
        if (type)
            this.type = type;
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "";
    }
    // tslint:disable-next-line:variable-name
    public execute(_transformer?: ExpressionTransformer): T {
        if ((this.type as IObjectType<T>).prototype)
            return new (this.type as IObjectType<T>)();
        return (this.type as () => T)();
    }
    public abstract clone(): ExpressionBase<T>;
}
