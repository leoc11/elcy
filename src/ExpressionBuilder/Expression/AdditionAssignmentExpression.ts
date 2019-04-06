import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";
import { MethodCallExpression } from "./MethodCallExpression";
import { resolveClone, hashCode, hashCodeAdd } from "../../Helper/Util";
import { GenericType } from "../../Common/Type";
export class AdditionAssignmentExpression<T extends number | string = number | string> implements IBinaryOperatorExpression<T> {
    public type: GenericType<T>;
    public itemType: GenericType<any>;
    constructor(public leftOperand: ParameterExpression<T>, public rightOperand: IExpression<T>) {
        this.type = this.leftOperand.type;
        if (leftOperand.type as any === String) {
            this.rightOperand = this.convertToStringOperand(rightOperand) as any;
        }
    }
    protected convertToStringOperand(operand: IExpression): IExpression<string> {
        if (operand.type !== String) {
            operand = new MethodCallExpression(operand, "toString", [], String);
        }
        return operand;
    }
    public toString(): string {
        return "(" + this.leftOperand.toString() + " += " + this.rightOperand.toString() + ")";
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new AdditionAssignmentExpression<T>(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("+=", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
}
