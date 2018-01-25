import { IObjectType, JoinType, RelationType } from "../../../Common/Type";
import { IRelationMetaData } from "../../../MetaData/Interface/index";
import { QueryBuilder } from "../../QueryBuilder";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";

export interface IJoinRelationMap<TParent, TChild> {
    parentColumn: IColumnExpression<any, TParent>;
    childColumn: IColumnExpression<any, TChild>;
}
export interface IJoinRelation<TParent, TChild> {
    child: IEntityExpression<TChild>;
    relationMaps: Array<IJoinRelationMap<TParent, TChild>>;
    type: JoinType;
}
export class JoinEntityExpression<T> implements IEntityExpression<T> {
    public get columns(): IColumnExpression[] {
        return this.entity.columns;
    }
    public get primaryColumns(): IColumnExpression[] {
        return this.entity.primaryColumns;
    }
    public get name() {
        return this.alias;
    }
    public get type(): IObjectType<T> {
        return this.entity.type;
    }
    public get alias(): string {
        return this.entity.alias;
    }
    public relations: Array<IJoinRelation<T, any>> = [];
    constructor(public entity: IEntityExpression<T>) {
        this.entity.parent = this;
    }
    public addRelation<T2>(relationMetaOrMap: IRelationMetaData<T, T2> | IRelationMetaData<T2, T>, aliasOrChild: string | IEntityExpression<T2>): IEntityExpression<T2>;
    public addRelation<T2>(relationMetaOrMap: Array<IJoinRelationMap<T, T2>>, child: IEntityExpression<T2>, type: JoinType): IEntityExpression<T2>;
    public addRelation<T2>(relationMetaOrMap: IRelationMetaData<T, T2> | IRelationMetaData<T2, T> | Array<IJoinRelationMap<T, T2>>, aliasOrChild: string | IEntityExpression<T2>, type?: JoinType) {
        let relationMaps: Array<IJoinRelationMap<T, T2>> = [];
        let child: IEntityExpression<T2>;
        if (!Array.isArray(relationMetaOrMap)) {
            const relationMeta = relationMetaOrMap as IRelationMetaData<T, T2> | IRelationMetaData<T2, T>;
            const isMaster = relationMeta.masterType === this.type;
            let targetType: IObjectType<T2>;
            if (aliasOrChild instanceof EntityExpression) {
                targetType = aliasOrChild.type;
            }
            else {
                targetType = (isMaster ? relationMeta.slaveType! : relationMeta.masterType!) as IObjectType<T2>;
            }

            child = aliasOrChild instanceof EntityExpression ? aliasOrChild : new EntityExpression<T2>(targetType, aliasOrChild as string);
            type = isMaster && relationMeta.relationType === RelationType.OneToMany ? JoinType.LEFT : JoinType.INNER;
            relationMaps = Object.keys(relationMeta.relationMaps!).select((o) => ({
                childColumn: child.columns.first((c) => isMaster ? c.property === (relationMeta.relationMaps as any)[o] : c.property === o),
                parentColumn: this.entity.columns.first((c) => !isMaster ? c.property === (relationMeta.relationMaps as any)[o] : c.property === o)
            })).toArray();
        }
        else {
            child = aliasOrChild as IEntityExpression<T2>;
            relationMaps = relationMetaOrMap as Array<IJoinRelationMap<T, T2>>;
        }
        let relation = this.relations.first((o) => o.child.type === child.type);
        relation = {
            child,
            relationMaps,
            type: type!
        };
        this.relations.push(relation);

        return relation.child;
    }
    public changeEntity(entity: IEntityExpression, newEntity: IEntityExpression) {
        if (this.entity === entity) {
            this.entity = newEntity;
        }
        else {
            for (const relation of this.relations) {
                if (relation.child === entity) {
                    relation.child = newEntity;
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
