import { IObjectType, JoinType } from "../../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";

export interface IJoinRelationMap<TParent, TChild, TType = any> {
    parentColumn: IColumnExpression<TType, TParent>;
    childColumn: IColumnExpression<TType, TChild>;
}
export interface IJoinRelation<TParent, TChild> {
    child: IEntityExpression<TChild>;
    relationMaps: Array<IJoinRelationMap<TParent, TChild, any>>;
    type: JoinType;
}
export class JoinEntityExpression<T> implements IEntityExpression<T> {
    public get columns(): IColumnExpression[] {
        return this.masterEntity.columns;
    }
    public get primaryColumns(): IColumnExpression[] {
        return this.masterEntity.primaryColumns;
    }
    public get name() {
        return this.alias;
    }
    public get type(): IObjectType<T> {
        return this.masterEntity.type;
    }
    public get alias(): string {
        return this.masterEntity.alias;
    }
    public relations: Array<IJoinRelation<T, any>> = [];
    constructor(public masterEntity: IEntityExpression<T>) {
        this.masterEntity.parent = this;
    }

    public getChildRelation<T2>(child: IEntityExpression<T2>) {
        return this.relations.first((o) => o.child === child);
    }
    public changeEntity(entity: IEntityExpression, newEntity: IEntityExpression) {
        if (this.masterEntity === entity) {
            this.masterEntity = newEntity;
            newEntity.parent = this;
        }
        else {
            for (const relation of this.relations) {
                if (relation.child === entity) {
                    relation.child = newEntity;
                    newEntity.parent = this;
                }
            }
        }
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        throw new Error("Method not implemented.");
    }
}
