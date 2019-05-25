import { GenericType } from "../../Common/Type";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
import { MethodCallExpression } from "./MethodCallExpression";
import { ParameterExpression } from "./ParameterExpression";
export class AdditionAssignmentExpression<T extends number | string = number | string> implements IBinaryOperatorExpression<T> {
    constructor(public leftOperand: ParameterExpression<T>, public rightOperand: IExpression<T>) {
        this.type = this.leftOperand.type;
        if (leftOperand.type as any === String) {
            this.rightOperand = this.convertToStringOperand(rightOperand) as any;
        }
    }
    public itemType: GenericType<any>;
    public type: GenericType<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new AdditionAssignmentExpression<T>(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("+=", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
    public toString(): string {
        return "(" + this.leftOperand.toString() + " += " + this.rightOperand.toString() + ")";
    }
    protected convertToStringOperand(operand: IExpression): IExpression<string> {
        if (operand.type !== String) {
            operand = new MethodCallExpression(operand, "toString", [], String);
        }
        return operand;
    }
}
