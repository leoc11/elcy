import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class MemberAccessExpression<TType, KProp extends keyof TType> extends ExpressionBase<TType[KProp]> {
    public static Create<TType, KProp extends keyof TType>(objectOperand: IExpression<TType>, member: KProp | ExpressionBase<KProp>) {
        const result = new MemberAccessExpression(objectOperand, member);
        if (objectOperand instanceof ValueExpression && (member instanceof ValueExpression || !(member instanceof ExpressionBase)))
            return ValueExpression.Create<TType[KProp]>(result);

        return result;
    }
    constructor(public ObjectOperand: IExpression<TType>, public MemberName: KProp | ExpressionBase<KProp>) {
        super(); // TODO
    }

    public toString(): string {
        let result = this.ObjectOperand.toString();
        if (this.MemberName instanceof ExpressionBase)
            result += "[" + this.MemberName.toString() + "]";
        else
            result += "." + this.MemberName;
        return result;
    }
    public execute() {
        let member = "";
        if (this.MemberName instanceof ExpressionBase)
            member = this.MemberName.execute();
        else
            member = this.MemberName;

        return this.ObjectOperand.execute()[member];
    }
}
