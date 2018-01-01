import { QueryBuilder } from "../QueryBuilder";
import { GroupByExpression } from "./GroupByExpression";
import { ISelectExpression } from "./ISelectExpression";
import { SelectExpression } from "./SelectExpression";
import { WhereExpression } from "./WhereExpression";

export class UnionExpression implements ISelectExpression {
    public leftEntity: SelectExpression | WhereExpression | GroupByExpression;
    public rightEntity: SelectExpression | WhereExpression | GroupByExpression;
    public isUnionAll: boolean;
    constructor(public alias: string) {
    }

    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.toUnionString(this);
    }
}
