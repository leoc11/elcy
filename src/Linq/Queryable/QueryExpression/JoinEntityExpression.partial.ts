import { IObjectType, JoinType, RelationType } from "../../../Common/Type";
import { IRelationMetaData } from "../../../MetaData/Interface/index";
import { EntityExpression } from "./EntityExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IJoinRelationMap, JoinEntityExpression } from "./JoinEntityExpression";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { SelectExpression } from "./SelectExpression";

declare module "./JoinEntityExpression" {
    interface JoinEntityExpression<T> {
        addRelation<T2>(relationMetaOrMap: IRelationMetaData<T, T2> | IRelationMetaData<T2, T>, aliasOrChild: string | IEntityExpression<T2>): IEntityExpression<T2>;
        addRelation<T2>(relationMetaOrMap: Array<IJoinRelationMap<T, T2>>, child: IEntityExpression<T2>, type: JoinType): IEntityExpression<T2>;
    }
}

JoinEntityExpression.prototype.addRelation = function <T, T2>(this: JoinEntityExpression<T>, relationMetaOrMap: IRelationMetaData<T, T2> | IRelationMetaData<T2, T> | Array<IJoinRelationMap<T, T2>>, aliasOrChild: string | IEntityExpression<T2>, type?: JoinType): IEntityExpression<T2> {
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
        const isToMany = isMaster && relationMeta.relationType === RelationType.OneToMany;
        type = isMaster && relationMeta.relationType === RelationType.OneToMany ? JoinType.LEFT : JoinType.INNER;
        if (isToMany) {
            if (!(child instanceof ProjectionEntityExpression)) {
                child = new ProjectionEntityExpression(new SelectExpression(child), child.alias);
            }
        }

        relationMaps = Object.keys(relationMeta.relationMaps!).select((o) => ({
            childColumn: child.columns.first((c) => isMaster ? c.property === (relationMeta.relationMaps as any)[o] : c.property === o),
            parentColumn: this.masterEntity.columns.first((c) => !isMaster ? c.property === (relationMeta.relationMaps as any)[o] : c.property === o)
        })).toArray();
    }
    else {
        child = aliasOrChild as IEntityExpression<T2>;
        relationMaps = relationMetaOrMap as Array<IJoinRelationMap<T, T2>>;
    }
    let relation = this.relations.first((o) => o.child.type === child.type);
    if (!relation) {
        relation = {
            child,
            relationMaps,
            type: type!
        };
        this.relations.push(relation);
    }
    relation.child.parent = this;

    return relation.child;
};
