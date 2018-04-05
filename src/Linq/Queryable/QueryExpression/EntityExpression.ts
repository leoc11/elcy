import { IObjectType, JoinType, RelationType } from "../../../Common/Type";
import { entityMetaKey } from "../../../Decorator/DecoratorKey";
import { EntityMetaData } from "../../../MetaData";
import { QueryBuilder } from "../../QueryBuilder";
import { ColumnExpression } from "./ColumnExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression, IJoinRelationMap, IJoinRelation } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { IRelationMetaData } from "../../../MetaData/Interface/index";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { SelectExpression } from "./SelectExpression";

export class EntityExpression<T = any> implements IEntityExpression<T> {
    public parent?: IEntityExpression;
    public relations: Array<IJoinRelation<T, any>> = [];
    public get name() {
        return this.metaData.name;
    }
    protected get metaData() {
        if (!this._metaData)
            this._metaData = Reflect.getOwnMetadata(entityMetaKey, this.type);
        return this._metaData;
    }
    public get columns(): IColumnExpression[] {
        if (!this._columns) {
            this._columns = this.metaData.properties.select((o) => new ColumnExpression(this, o, this.metaData.primaryKeys.contains(o))).toArray();
        }
        return this._columns;
    }
    public get primaryColumns(): IColumnExpression[] {
        if (!this._primaryColumns) {
            this._primaryColumns = this.metaData.primaryKeys.select((o) => this.columns.first((c) => c.property === o)).toArray();
        }
        return this._primaryColumns;
    }
    public get defaultOrders(): IOrderExpression[] {
        if (!this._defaultOrders) {
            if (this.metaData.defaultOrder)
                this._defaultOrders = this.metaData.defaultOrder!.select((o) => ({
                    column: this.columns.first((c) => c.property === o.property),
                    direction: o.direction
                })).toArray();
            else
                this._defaultOrders = [];
        }
        return this._defaultOrders;
    }
    private _metaData: EntityMetaData<T>;
    private _columns: IColumnExpression[];
    private _primaryColumns: IColumnExpression[];
    private _defaultOrders: IOrderExpression[];
    constructor(public readonly type: IObjectType<T>, public alias: string) {
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        return queryBuilder.getExpressionString(this);
    }
    public clone() {
        const clone = new EntityExpression(this.type, this.alias);
        clone.relations = this.relations;
        clone.parent = this.parent;
        return clone;
    }
    public addRelation<T2>(child: IEntityExpression<T2>, relationMetaOrMap: IRelationMetaData<T, T2> | IRelationMetaData<T2, T> | Array<IJoinRelationMap<T, T2>>, name: string, type?: JoinType): IEntityExpression<T2> {
        let relationMaps: Array<IJoinRelationMap<T, T2>> = [];

        if (!Array.isArray(relationMetaOrMap)) {
            const relationMeta = relationMetaOrMap as IRelationMetaData<T, T2> | IRelationMetaData<T2, T>;
            const isMaster = relationMeta.masterType === this.type;
            const isToMany = isMaster && relationMeta.relationType === RelationType.OneToMany;
            type = isMaster && relationMeta.relationType === RelationType.OneToMany ? JoinType.LEFT : JoinType.INNER;
            if (isToMany) {
                if (!(child instanceof ProjectionEntityExpression)) {
                    child = new ProjectionEntityExpression(new SelectExpression(child), child.alias, child.type);
                }
            }

            relationMaps = Object.keys(relationMeta.relationMaps!).select((o) => ({
                childColumn: child.columns.first((c) => isMaster ? c.property === (relationMeta.relationMaps as any)[o] : c.property === o),
                parentColumn: this.columns.first((c) => !isMaster ? c.property === (relationMeta.relationMaps as any)[o] : c.property === o)
            })).toArray();
        }
        else {
            child = child as IEntityExpression<T2>;
            relationMaps = relationMetaOrMap as Array<IJoinRelationMap<T, T2>>;
        }
        let relation = type === JoinType.LEFT ? undefined : this.relations.first((o) => o.child.type === child.type);
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
