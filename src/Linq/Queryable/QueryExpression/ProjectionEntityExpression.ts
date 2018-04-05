import { IObjectType, JoinType } from "../../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression, IJoinRelation, IJoinRelationMap } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { SelectExpression } from "./SelectExpression";
import { ProjectionColumnExpression } from "./ProjectionColumnExpression";

export class ProjectionEntityExpression<T = any> implements IEntityExpression<T> {
    public name: string = "";
    public relations: Array<IJoinRelation<T, any>> = [];
    public get parent(): IEntityExpression | undefined {
        return this.select.entity.parent;
    }
    public set parent(value) {
        this.select.entity.parent = value;
    }
    public get columns(): IColumnExpression[] {
        if (!this._columns) {
            this._columns = this.select.columns.groupBy((o) => o.entity).selectMany((o) => {
                return o.select((c) => new ProjectionColumnExpression(c, this));
            }).toArray();
        }
        return this._columns;
    }
    public set columns(value) {
        this._columns = value;
    }
    public get primaryColumns(): IColumnExpression[] {
        if (!this._primaryColumns) {
            this._primaryColumns = this.columns.where((o) => o.isPrimary).toArray();
        }
        return this._primaryColumns;
    }
    public get defaultOrders(): IOrderExpression[] {
        return this.select.orders;
    }
    protected _columns: IColumnExpression[];
    private _primaryColumns: IColumnExpression[];
    constructor(public select: SelectExpression, public alias: string, public readonly type: IObjectType<T> = Object as any) {
        this.select.parent = this;
        this.relations = this.select.entity.relations.slice();

    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        return queryBuilder.getExpressionString(this);
    }
    public clone() {
        const clone = new ProjectionEntityExpression(this.select, this.alias, this.type);
        return clone;
    }
    public addRelation<T2>(child: IEntityExpression<T2>, relationMaps: Array<IJoinRelationMap<T, T2>>, name: string, type?: JoinType): IEntityExpression<T2> {
        let relation = type === JoinType.LEFT ? undefined : this.relations.first((o) => o.name === name);
        if (!relation) {
            relation = {
                child,
                name,
                relationMaps,
                type: type!
            };
            this.relations.push(relation);
        }
        relation.child.parent = this;

        return relation.child;
    }

    public getChildRelation<T2>(child: IEntityExpression<T2>) {
        return this.relations.first((o) => o.child === child);
    }
    public changeEntity(entity: IEntityExpression, newEntity: IEntityExpression) {
        for (const relation of this.relations) {
            if (relation.child === entity) {
                relation.child = newEntity;
                newEntity.parent = this;
            }
        }
    }
}
