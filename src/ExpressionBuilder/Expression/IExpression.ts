import { GenericType } from "../../Common/Type";
export interface IExpression<T = any> {
    itemType?: GenericType<any>;
    type: GenericType<T>;
    clone(replaceMap?: Map<IExpression, IExpression>): IExpression<T>;
    hashCode(): number;
    toString(): string;
}
