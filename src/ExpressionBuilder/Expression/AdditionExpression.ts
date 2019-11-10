import { GenericType } from "../../Common/Type";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
import { MethodCallExpression } from "./MethodCallExpression";

export class AdditionExpression<T extends number | string = any> implements IBinaryOperatorExpression<T> {
    constructor(leftOperand: IExpression, rightOperand: IExpression) {
        if (leftOperand.type === String || rightOperand.type === String) {
            this.type = String as any;
            this.leftOperand = this.convertToStringOperand(leftOperand) as any;
            this.rightOperand = this.convertToStringOperand(rightOperand) as any;
        }
        else {
            this.leftOperand = leftOperand;
            this.rightOperand = rightOperand;
            this.type = Number as any;
        }
    }
    public itemType?: GenericType<T>;
    public leftOperand: IExpression<T>;
    public rightOperand: IExpression<T>;
    public type: GenericType<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new AdditionExpression<T>(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public convertToStringOperand(operand: IExpression): IExpression<string> {
        if (operand.type !== String) {
            operand = new MethodCallExpression(operand, "toString", [], String);
        }
        return operand as any;
    }
    public hashCode() {
        if (this.type as GenericType === Number) {
            return hashCode("+", this.leftOperand.hashCode()) + hashCode("+", this.rightOperand.hashCode());
        }
        return hashCodeAdd(hashCode("+", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
    public toString(): string {
        return "(" + this.leftOperand.toString() + " + " + this.rightOperand.toString() + ")";
    }
}
