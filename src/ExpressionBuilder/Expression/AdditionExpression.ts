import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
import { MethodCallExpression } from "./MethodCallExpression";
import { resolveClone, hashCodeAdd, hashCode } from "../../Helper/Util";
import { GenericType } from "../../Common/Type";

export class AdditionExpression<T extends number | string = any> implements IBinaryOperatorExpression<T> {
    public leftOperand: IExpression<T>;
    public rightOperand: IExpression<T>;
    public type: GenericType<T>;
    public itemType?: GenericType<T>;
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
    public convertToStringOperand(operand: IExpression): IExpression<string> {
        if (operand.type !== String) {
            operand = new MethodCallExpression(operand, "toString", []);
        }
        return operand as any;
    }
    public toString(): string {
        return "(" + this.leftOperand.toString() + " + " + this.rightOperand.toString() + ")";
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new AdditionExpression<T>(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("+", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
}
