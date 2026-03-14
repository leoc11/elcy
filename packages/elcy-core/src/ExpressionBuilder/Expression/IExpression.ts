import { GenericType } from "../../Common/Type";
export interface IExpression<T = unknown> {
    itemType?: GenericType<unknown>;
    type: GenericType<T>;
    clone(replaceMap?: Map<IExpression, IExpression>): IExpression<T>;
    hashCode(): number;
    toString(): string;
}
