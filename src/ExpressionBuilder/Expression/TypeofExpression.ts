import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class TypeofExpression extends ExpressionBase<string> {
    public static Create(operand: IExpression) {
        const result = new TypeofExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<string>(result);

        return result;
    }
    constructor(public Operand: IExpression) {
        super(String);
    }

    public ToString(): string {
        return "typeof " + this.Operand.ToString();
    }
    public Execute() {
        // tslint:disable-next-line:no-bitwise
        return typeof this.Operand.Execute();
    }
}
