import { GenericType } from "../../Common/Type";
export interface IExpression<T = any> {
    type: GenericType<T>;
    itemType?: GenericType<any>;
    toString(): string;
    clone(replaceMap?: Map<IExpression, IExpression>): IExpression<T>;
    hashCode(): number;
}
