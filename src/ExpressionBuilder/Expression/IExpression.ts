import { genericType, IObjectType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
export interface IExpression<T = any> {
    type: genericType<T>;
    ToString(transformer: ExpressionTransformer): string;
    Execute(transformer: ExpressionTransformer): T | any;
}

export class ExpressionBase<T = any> implements IExpression<T> {
    public type: genericType<T>;
    constructor(type?: genericType<T>) {
        if (type)
            this.type = type;
    }
    public ToString() {
        return "";
    }
    public Execute(): T {
        if ((this.type as IObjectType<T>).prototype)
            return new (this.type as IObjectType<T>)();
        return (this.type as () => T)();
    }
}
