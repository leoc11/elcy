import { ExpressionBase } from "./IExpression";

export class ParameterExpression<TType> implements ExpressionBase<TType> {
    constructor(protected Name: string, protected Type: { new(): TType }) {
    }

    public ToString(): string {
        return this.Name;
    }
    public Execute() {
        throw new Error("Method not implemented.");
    }

}
