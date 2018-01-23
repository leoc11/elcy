import { IObjectType, RelationType } from "../../../Common/Type";
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
    type: "LEFT" | "RIGHT" | "INNER" | "OUTER";
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
    public relations: Array<IJoinRelation<T, any>> = [];
    constructor(public entity: IEntityExpression, public alias: string) {
        this.entity.parent = this;
    }
    public addRelation<T2>(relationMeta: IRelationMetaData<T, T2> | IRelationMetaData<T2, T>, aliasOrChild: string | IEntityExpression<T2>) {
        const isMaster = relationMeta.masterType === this.type;
        let targetType: IObjectType<T2>;
        if (aliasOrChild instanceof EntityExpression) {
            targetType = aliasOrChild.type;
        }
        else {
            targetType = (isMaster ? relationMeta.slaveType! : relationMeta.masterType!) as IObjectType<T2>;
        }

        let relation = this.relations.first((o) => o.child.type === targetType);
        if (relation == null) {
            const joinEntity = aliasOrChild instanceof EntityExpression ? aliasOrChild : new EntityExpression<T2>(targetType, aliasOrChild as string);
            const jointType = isMaster && relationMeta.relationType === RelationType.OneToMany ? "LEFT" : "INNER";
            const relationMaps = Object.keys(relationMeta.relationMaps!).select((o) => ({
                childColumn: joinEntity.columns.first((c) => isMaster ? c.property === (relationMeta.relationMaps as any)[o] : c.property === o),
                parentColumn: this.entity.columns.first((c) => !isMaster ? c.property === (relationMeta.relationMaps as any)[o] : c.property === o)
            })).toArray();
            relation = {
                child: joinEntity,
                relationMaps,
                type: jointType
            };
            this.relations.push(relation);
        }

        return relation.child;
    }
    public changeEntity<TC>(entity: IEntityExpression<TC>, newEntity: IEntityExpression<TC>) {
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
