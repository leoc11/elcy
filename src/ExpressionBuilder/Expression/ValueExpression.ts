import { GenericType, NullConstructor } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { hashCode } from "../../Helper/Util";

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
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);

        if (this.expressionString === "")
            this.expressionString = JSON.stringify(this.value);
        return this.expressionString;
    }
    public execute() {
        return this.value;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        return this;
    }
    public hashCode() {
        return hashCode(this.value ? this.value.toString() : "NULL");
    }
}
