import { ExpressionBase } from "./IExpression";
export class ValueExpression<T> extends ExpressionBase<T> {
    // tslint:disable-next-line:ban-types
    public readonly Type: Function | undefined | null;

    constructor(protected Value: T, private ExpressionString: string = "") {
        super(Value);

        if (this.ExpressionString === "") {
            if (typeof this.Type === "string")
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
