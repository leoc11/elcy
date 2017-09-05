import { IExpression } from "./IExpression";
export class ValueExpression<T> implements IExpression {
    public readonly Type: string;

    constructor(protected Value: T) {
        this.Type = typeof this.Value;
    }

    public ToString(): string {
        if (typeof this.Type === "string")
            return "'" + this.Type + "'";

        return this.Type + "";
    }
    public Execute() {
        return this.Value;
    }

}
