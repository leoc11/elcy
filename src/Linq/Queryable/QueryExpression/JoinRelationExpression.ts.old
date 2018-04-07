import { IEntityExpression } from "./IEntityExpression";
import { IJoinRelationMap } from "./JoinEntityExpression";

export class JoinRelationExpression<TParent = any, TChild = any> {
    constructor(public parent: IEntityExpression<TParent>, public children: IEntityExpression<TChild>, public readonly relations: Array<IJoinRelationMap<TParent, TChild>> = [], public type: "INNER" | "LEFT" | "RIGHT" | "FULL" = "LEFT") {

    }
}
