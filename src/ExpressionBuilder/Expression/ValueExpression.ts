import { GenericType, NullConstructor } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase } from "./IExpression";

export class ValueExpression<T> extends ExpressionBase<T> {
    public static create<TType>(value: ExpressionBase<TType> | TType, expressionString?: string): ValueExpression<TType> {
        if (value instanceof ExpressionBase)
            return new ValueExpression<TType>(value.execute(), value.toString());

        return new ValueExpression(value, expressionString);
    }
    public get type(): GenericType<T> {
        if (this.value === null || this.value === undefined)
            return NullConstructor as any;
        return this.value.constructor as any;
    }
    constructor(public readonly value: T, private expressionString: string = "") {
        super();
        if (this.expressionString === "") {
            this.expressionString = JSON.stringify(this.value);
        }
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return this.expressionString;
    }
    public execute() {
        return this.value;
    }
    public clone() {
        return new ValueExpression(this.value, this.expressionString);
    }
}
