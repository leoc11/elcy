import { GenericType } from "../../Common/Type";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
import { MethodCallExpression } from "./MethodCallExpression";
import { ParameterExpression } from "./ParameterExpression";

export class AssignmentExpression<T = unknown> implements IBinaryOperatorExpression<T> {
    constructor(public leftOperand: ParameterExpression<T>, public rightOperand: IExpression<T>) {
        this.type = leftOperand.type;
        if ((leftOperand.type as GenericType<string>) === String) {
            (this.rightOperand as IExpression<string>) = this.convertToStringOperand(rightOperand);
        }
    }
    public itemType?: GenericType<T>;
    public type: GenericType<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new AssignmentExpression<T>(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public convertToStringOperand(operand: IExpression): IExpression<string> {
        if (operand.type !== String) {
            operand = new MethodCallExpression(operand as IExpression<string>, "toString", [], String);
        }
        return operand as IExpression<string>;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("=", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
    public toString(): string {
        return "(" + this.leftOperand.toString() + " = " + this.rightOperand.toString() + ")";
    }
}
