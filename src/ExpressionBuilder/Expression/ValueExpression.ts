import { GenericType, NullConstructor } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase } from "./IExpression";

export class ValueExpression<T> extends ExpressionBase<T> {
    public static Create<TType>(value: ExpressionBase<TType> | TType, expressionString?: string): ValueExpression<TType> {
        if (value instanceof ExpressionBase)
            return new ValueExpression<TType>(value.execute(), value.toString());

        return new ValueExpression(value, expressionString);
    }
    public get type(): GenericType<T> {
        if (this.value === null || this.value === undefined)
            return NullConstructor as any;
        return this.value.constructor as any;
    }
    constructor(public readonly value: T, private ExpressionString: string = "") {
        super();
        if (this.ExpressionString === "") {
            this.ExpressionString = JSON.stringify(this.value);
        }
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return this.ExpressionString;
    }
    public execute() {
        return this.value;
    }

}
