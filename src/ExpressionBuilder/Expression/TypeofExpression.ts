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

    public toString(): string {
        return "typeof " + this.Operand.toString();
    }
    public execute() {
        // tslint:disable-next-line:no-bitwise
        return typeof this.Operand.execute();
    }
}
