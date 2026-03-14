import { GenericType } from "../../Common/Type";
import { hashCode } from "../../Helper/Util";
import { IExpression } from "./IExpression";

export class ParameterExpression<T = unknown> implements IExpression<T> {
    constructor(public name: string, type?: GenericType<T>) {
        this.type = type;
    }
    public itemType?: GenericType;
    public type: GenericType<T>;
    public clone(): ParameterExpression<T> {
        const clone = new ParameterExpression(this.name, this.type);
        clone.itemType = this.itemType;
        return clone;
    }
    public hashCode() {
        return this.type ? hashCode(this.type.name) : 27;
    }
    public toString(): string {
        return this.name;
    }
}
