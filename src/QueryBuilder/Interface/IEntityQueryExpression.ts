import { IObjectType } from "../../Common/Type";

export interface IEntityQueryExpression<T> {
    alias: string;
    type: IObjectType<T>;
}
