import { GenericType, NullConstructor } from "../../Common/Type";
import { IExpression } from "./IExpression";
import { hashCode } from "../../Helper/Util";

export class ValueExpression<T = any> implements IExpression<T> {
    public get type(): GenericType<T> {
        if (this.value === null || this.value === undefined)
            return NullConstructor as any;
        return this.value.constructor as any;
    }
    constructor(public readonly value: T, public expressionString: string = null) { }
    public toString(): string {
        if (!this.expressionString)
            this.expressionString = JSON.stringify(this.value);
        return this.expressionString;
    }
    public clone() {
        return this;
    }
    public hashCode() {
        return hashCode(this.expressionString ? this.expressionString : this.value ? this.value.toString() : "NULL");
    }
}
