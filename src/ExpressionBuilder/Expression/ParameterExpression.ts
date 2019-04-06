import { GenericType } from "../../Common/Type";
import { IExpression } from "./IExpression";
import { hashCode } from "../../Helper/Util";

export class ParameterExpression<T = any> implements IExpression<T> {
    public type: GenericType<T>;
    public itemType?: GenericType;
    constructor(public name: string, type?: GenericType<T>) {
        this.type = type;
    }
    public toString(): string {
        return this.name;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): ParameterExpression<T> {
        return this;
    }
    public hashCode() {
        return this.type ? hashCode(this.type.name) : 27;
    }
}
