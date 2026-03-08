import { GenericType } from "../../Common/Type";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
import { MethodCallExpression } from "./MethodCallExpression";

export class AdditionExpression<T extends string | number = string | number> implements IBinaryOperatorExpression<T> {
    constructor(leftOperand: IExpression<T>, rightOperand: IExpression<T>) {
        if ((leftOperand as IExpression<string>).type === String || (rightOperand as IExpression<string>).type === String) {
            (this.type as GenericType<string>) = String;
            (this.leftOperand as IExpression<string>) = this.convertToStringOperand(leftOperand);
            (this.rightOperand as IExpression<string>) = this.convertToStringOperand(rightOperand);
        }
        else {
            (this.leftOperand as IExpression<number>) = leftOperand as IExpression<number>;
            (this.rightOperand as IExpression<number>) = rightOperand as IExpression<number>;
            (this.type as GenericType<number>) = Number;
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
    public convertToStringOperand(operand: IExpression<string | number>): IExpression<string> {
        if (operand.type === Number) {
            operand = new MethodCallExpression<number, "toString", string>(operand as IExpression<number>, "toString", [], String);
        }
        return operand as IExpression<string>;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("+", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
    public toString(): string {
        return "(" + this.leftOperand.toString() + " + " + this.rightOperand.toString() + ")";
    }
}
