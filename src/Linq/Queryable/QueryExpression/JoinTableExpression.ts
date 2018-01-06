import { IObjectType } from "../../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder";
import { ColumnExpression } from "./ColumnExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";

export class JoinEntityExpression<T, T2, TR extends {[prop in keyof (T | T2)]: any}> implements IEntityExpression<TR> {
    public get columns(): IColumnExpression[] {
        return this.leftEntity.columns.concat(this.rightEntity.columns);
    }
    public leftEntity: IEntityExpression;
    public rightEntity: IEntityExpression;
    public type: IObjectType<TR>;
    public relations: Array<{ leftColumn: IColumnExpression, rightColumn: IColumnExpression }> = [];
    constructor(public readonly entity: IEntityExpression, public readonly entity2: IEntityExpression, public alias: string, public readonly joinType: "INNER" | "LEFT" | "RIGHT" | "FULL" = "LEFT", type?: IObjectType<TR>) {
        if (type)
            this.type = type;
    }

    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.toJoinEntityString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        throw new Error("Method not implemented.");
    }

    public has(type: IObjectType) {
        return this.leftEntity.has(type) || this.rightEntity.has(type);
    }
    public get(type: IObjectType) {
        return this.leftEntity.get(type) || this.rightEntity.get(type);
    }
}
