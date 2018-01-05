import { ExpressionBase } from "./IExpression";

export class ValueExpression<T> extends ExpressionBase<T> {
    public static Create<TType>(value: ExpressionBase<TType> | TType, expressionString?: string): ValueExpression<TType> {
        if (value instanceof ExpressionBase)
            return new ValueExpression<TType>(value.execute(), value.toString());

        return new ValueExpression(value, expressionString);
    }
    constructor(protected Value: T, private ExpressionString: string = "") {
        super();
        if (this.ExpressionString === "") {
            this.ExpressionString = JSON.stringify(this.Value);
        }
    }

    public toString(): string {
        return this.ExpressionString;
    }
    public execute() {
        return this.Value;
    }

}
