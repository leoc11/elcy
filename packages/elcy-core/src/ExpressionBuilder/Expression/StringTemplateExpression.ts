import { PrimitiveType } from "src/Common/Type";
import { hashCode } from "../../Helper/Hash";
import { IExpression } from "./IExpression";

export class StringTemplateExpression implements IExpression<string> {
    constructor(public readonly template: string) { }
    public type: PrimitiveType<string> = String;
    public clone() {
        return this;
    }
    public hashCode() {
        return hashCode(this.template, hashCode("`"));
    }
    public toString(): string {
        return "`" + this.template + "`";
    }
}
