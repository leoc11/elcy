import { IExpression } from "./IExpression";

export class ParameterExpression<T> implements IExpression {
    public readonly Type: string;

    constructor(protected ParamName: string, ctor: { new(): T }) {
        this.Type = ctor.name;
    }

    public ToString(): string {
        if (typeof this.Type === "string")
            return "'" + this.Type + "'";

        return this.Type + "";
    }
    public Execute() {
        throw new Error("Method not implemented.");
    }

}
