import { GenericType, PrimitiveType } from "src/Common/Type";
import { FunctionCallExpression } from "./FunctionCallExpression";
import { IExpression } from "./IExpression";
import { MethodCallExpression } from "./MethodCallExpression";
import { ValueExpression } from "./ValueExpression";
export abstract class BitwiseExpression<T extends number | bigint> implements IExpression<T> {
    constructor(type?: GenericType) {
        if (type !== Number && type !== BigInt) {
            type = Number;
        }

        this.type = type as PrimitiveType<T>;
    }
    public type: PrimitiveType<T>;
    public abstract clone(replaceMap?: Map<IExpression, IExpression>): BitwiseExpression<T>;
    public abstract hashCode(): number;
    protected convertOperand(operand: IExpression): IExpression<T> {
        if (operand.type === Number || operand.type === BigInt) {
            return operand as IExpression<T>;
        }

        if (operand.type !== String) {
            operand = new MethodCallExpression<Object, "toString", string>(operand, "toString", [], String);
        }

        if (this.type === BigInt as Extract<PrimitiveType<T>, BigInt>) {
            return new FunctionCallExpression(new ValueExpression(BigInt as unknown as (value: unknown) => T), [operand]);
        }

        return new FunctionCallExpression(new ValueExpression(parseInt as unknown as (value: unknown) => T), [operand]);
    }
}
