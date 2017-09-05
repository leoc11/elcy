import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class AdditonExpression implements IExpression {

    constructor(protected LeftOperand: ValueExpression<any>, protected RightOperand: ValueExpression<any>) {
    }

    public ToString(): string {
        return "(" + this.LeftOperand.ToString + " + " + this.RightOperand.ToString() + ")";
    }
    public Execute() {
        return this.LeftOperand.Execute() + this.RightOperand.Execute();
    }
}
