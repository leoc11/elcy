import { IObjectType, RelationType } from "../../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IRelationMetaData } from "../../../MetaData/Interface/index";
import { MasterRelationMetaData } from "../../../MetaData/Relation/index";
import { EntityExpression } from "./EntityExpression";

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
        return this.entity.columns.concat(this.relations.selectMany((o) => o.child.columns));
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
    public addRelation<T2>(relationMeta: IRelationMetaData<T, T2>, queryBuilder: QueryBuilder) {
        const targetType = relationMeta instanceof MasterRelationMetaData ? relationMeta.slaveType! : relationMeta.masterType!;
        let relation = this.relations.first((o) => o.child.type === targetType);
        if (relation == null) {
            const joinEntity = new EntityExpression(targetType, queryBuilder.newAlias());
            const jointType = relationMeta.relationType === RelationType.OneToMany ? "LEFT" : "INNER";
            const relationMaps = Object.keys(relationMeta.relationMaps!).select((o) => ({
                childColumn: joinEntity.columns.first((c) => c.property === (relationMeta.relationMaps as any)[o]),
                parentColumn: this.entity.columns.first((c) => c.property === o)
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
