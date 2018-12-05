import { ISelectRelation } from "./ISelectRelation";
import { JoinType } from "../../Common/Type";

export interface IJoinRelation<T = any, TChild = any> extends ISelectRelation<T, TChild> {
    type: JoinType;
}