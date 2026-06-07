import { Null } from "../../Common/Constant";
import { GenericType } from "../../Common/Type";
import { hashCode } from "../../Helper/Hash";
import { IExpression } from "./IExpression";

export class ValueExpression<T = unknown> implements IExpression<T> {
    public get type(): GenericType<T> {
        if (this.value === null || this.value === undefined) {
            return Null;
        }
        return this.value.constructor as GenericType<T>;
    }
    constructor(public readonly value: T, public expressionString: string = null) { }
    public clone() {
        return this;
    }
    public hashCode() {
        return hashCode(this.expressionString ? this.expressionString : this.value ? this.value.toString() : "NULL");
    }
    public toString(): string {
        if (!this.expressionString) {
            this.expressionString = JSON.stringify(this.value);
        }
        return this.expressionString;
    }
}
