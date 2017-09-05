import { IExpression, ValueExpression } from "./IExpression";
export class AddOperatorExpression implements IExpression {

    constructor(protected LeftOperand: ValueExpression, protected RightOperand: ValueExpression) {
    }

    public ToString(): string {
        return "(" + this.LeftOperand.ToString + " + " + this.RightOperand.ToString() + ")";
    }
    public Execute() {
        return this.LeftOperand.Execute() + this.RightOperand.Execute();
    }

}
