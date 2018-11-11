import { GenericType, NullConstructor } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { IExpression } from "./IExpression";
import { hashCode } from "../../Helper/Util";

export class ValueExpression<T> implements IExpression<T> {
    public static create<T>(value: IExpression<T> | T, expressionString?: string): ValueExpression<T> {
        if ((value as IExpression).type)
            return new ValueExpression<T>((value as IExpression).execute(), value.toString());

        return new ValueExpression(value as T, expressionString);
    }
    public get type(): GenericType<T> {
        if (this.value === null || this.value === undefined)
            return NullConstructor as any;
        return this.value.constructor as any;
    }
    constructor(public readonly value: T, public expressionString: string = "") { }
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
        return hashCode(this.expressionString ? this.expressionString : this.value ? this.value.toString() : "NULL");
    }
}
