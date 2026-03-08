import { hashCode } from "../../Helper/Util";
import { IExpression } from "./IExpression";

export class StringTemplateExpression implements IExpression<string> {
    constructor(public readonly template: string) { }
    public type = String;
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
