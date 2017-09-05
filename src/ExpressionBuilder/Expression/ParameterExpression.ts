import { IExpression } from "./IExpression";

export class ParameterExpression<T> implements IExpression {
    public readonly Type: string;

    constructor(TCtor: { new(): T }, protected Name: string) {
        this.Type = TCtor.name;
    }

    public ToString(): string {
        return this.Name;
    }
    public Execute() {
        throw new Error("Method not implemented.");
    }

}
