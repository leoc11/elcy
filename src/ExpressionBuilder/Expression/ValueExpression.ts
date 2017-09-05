import { IExpression } from "./IExpression";
export class ValueExpression<T> implements IExpression {
    public readonly Type: string;

    constructor(protected Value: T) {
        this.Type = typeof this.Value;
    }

    public ToString(): string {
        throw new Error("Method not implemented.");
    }
    public Execute() {
        throw new Error("Method not implemented.");
    }

}
