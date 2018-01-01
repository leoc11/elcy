import { QueryBuilder } from "../QueryBuilder";
import { ColumnExpression } from "./ColumnExpression";
import { TableExpression } from "./TableExpression";

export class JoinTableExpression extends TableExpression {
    public get columns() {
        return this.leftEntity.columns.concat(this.rightEntity.columns);
    }
    public leftEntity: TableExpression;
    public rightEntity: TableExpression;
    public joinType: "INNER" | "LEFT" | "RIGHT" | "FULL";
    public relations: Array<{ leftColumn: ColumnExpression, rightColumn: ColumnExpression }> = [];
    constructor(public alias: string) {
        super(Object, alias);
    }

    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.toJoinEntityString(this);
    }
}
