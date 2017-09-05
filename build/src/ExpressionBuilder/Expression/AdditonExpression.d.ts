import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export declare class AdditonExpression implements IExpression {
    protected LeftOperand: ValueExpression<any>;
    protected RightOperand: ValueExpression<any>;
    constructor(LeftOperand: ValueExpression<any>, RightOperand: ValueExpression<any>);
    ToString(): string;
    Execute(): any;
}
