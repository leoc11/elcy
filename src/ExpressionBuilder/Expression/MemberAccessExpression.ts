import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class MemberAccessExpression<TType, KProp extends keyof TType> extends ExpressionBase<TType[KProp]> {
    public static Create<TType, KProp extends keyof TType>(objectOperand: IExpression<TType>, member: KProp | ExpressionBase<KProp>) {
        const result = new MemberAccessExpression(objectOperand, member);
        if (objectOperand instanceof ValueExpression && (member instanceof ValueExpression || !(member instanceof ExpressionBase)))
            return ValueExpression.Create<TType[KProp]>(result);

        return result;
    }
    constructor(public objectOperand: IExpression<TType>, public memberName: KProp | ExpressionBase<KProp>) {
        super(); // TODO
    }

    public toString(transformer: ExpressionTransformer): string {
        let result = this.objectOperand.toString(transformer);
        if (this.memberName instanceof ExpressionBase)
            result += "[" + this.memberName.toString(transformer) + "]";
        else
            result += "." + this.memberName;
        return result;
    }
    public execute(transformer: ExpressionTransformer) {
        let member = "";
        if (this.memberName instanceof ExpressionBase)
            member = this.memberName.execute(transformer);
        else
            member = this.memberName;

        return this.objectOperand.execute(transformer)[member];
    }
}
