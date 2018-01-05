import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class BitwiseXorExpression extends ExpressionBase<number> {
    public static Create(leftOperand: IExpression, rightOperand: IExpression) {
        const result = new BitwiseXorExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<number>(result);

        return result;
    }
    constructor(protected LeftOperand: IExpression, protected RightOperand: IExpression) {
        super(Number);
    }

    public toString(): string {
        return "(" + this.LeftOperand.toString() + " ^ " + this.RightOperand.toString() + ")";
    }
    public execute() {
        // tslint:disable-next-line:no-bitwise
        return this.LeftOperand.execute() ^ this.RightOperand.execute();
    }
}
