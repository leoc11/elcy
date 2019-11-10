import { GenericType } from "../../Common/Type";
import { hashCode } from "../../Helper/Util";
import { IExpression } from "./IExpression";

export class ParameterExpression<T = any> implements IExpression<T> {
    constructor(public name: string, type?: GenericType<T>, public index?: number) {
        this.type = type;
    }
    public itemType?: GenericType;
    public type: GenericType<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>): ParameterExpression<T> {
        return this;
    }
    public hashCode() {
        return this.type ? hashCode(this.type.name) : 27;
    }
    public toString(): string {
        return this.name;
    }
}
