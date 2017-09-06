import { ExpressionBase } from "./IExpression";
export class ValueExpression<T> extends ExpressionBase<T> {
    public static Create<TType>(value: ExpressionBase<TType> | TType): ValueExpression<TType> {
        if (value instanceof ExpressionBase)
            return new ValueExpression<TType>(value.Execute(), value.ToString());

        return new ValueExpression(value);
    }
    constructor(protected Value: T, private ExpressionString: string = "") {
        super();
        if (this.ExpressionString === "") {
            if (typeof this.Value === "string")
                this.ExpressionString = "'" + this.Value + "'";

            this.ExpressionString = this.Value + "";
        }
    }

    public ToString(): string {
        return this.ExpressionString;
    }
    public Execute() {
        return this.Value;
    }

}
