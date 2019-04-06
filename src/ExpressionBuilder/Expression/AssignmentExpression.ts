import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";
import { MethodCallExpression } from "./MethodCallExpression";
import { resolveClone, hashCodeAdd, hashCode } from "../../Helper/Util";
import { GenericType } from "../../Common/Type";
export class AssignmentExpression<T = any> implements IBinaryOperatorExpression<T> {
    public type: GenericType<T>;
    public itemType?: GenericType<T>;
    constructor(public leftOperand: ParameterExpression, public rightOperand: IExpression) {
        this.type = leftOperand.type;
        if (leftOperand.type === String) {
            this.rightOperand = this.convertToStringOperand(rightOperand) as any;
        }
    }
    public convertToStringOperand(operand: IExpression): IExpression<string> {
        if (operand.type !== String) {
            operand = new MethodCallExpression(operand, "toString", [], String);
        }
        return operand as any;
    }
    public toString(): string {
        return "(" + this.leftOperand.toString() + " = " + this.rightOperand.toString() + ")";
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new AssignmentExpression<T>(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("=", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
}
