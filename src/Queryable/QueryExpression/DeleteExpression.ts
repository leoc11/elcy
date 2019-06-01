import { DeleteMode, IObjectType, JoinType, OrderDirection } from "../../Common/Type";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { JoinRelation } from "../Interface/JoinRelation";
import { EntityExpression } from "./EntityExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { IQueryExpression } from "./IQueryExpression";
import { SelectExpression } from "./SelectExpression";
export interface IDeleteIncludeRelation<T = any, TChild = any> {
    child: DeleteExpression<TChild>;
    parent: IQueryExpression<T>;
    relations: IExpression<boolean>;
}
export class DeleteExpression<T = any> implements IQueryExpression<void> {
    public get entity() {
        return this.select.entity as EntityExpression<T>;
    }
    public get joins() {
        return this.select.joins;
    }
    public get orders() {
        return this.select.orders;
    }
    public get paging() {
        return this.select.paging;
    }
    public get paramExps() {
        return this.select.paramExps;
    }
    public set paramExps(value) {
        this.select.paramExps = value;
    }
    public get type() {
        return undefined as any;
    }
    public get where() {
        return this.select.where;
    }
    constructor(entity: IEntityExpression<T>, deleteMode?: IExpression<DeleteMode>);
    constructor(select: SelectExpression<T>, deleteMode?: IExpression<DeleteMode>);
    constructor(selectOrEntity: IEntityExpression<T> | SelectExpression<T>, deleteMode?: IExpression<DeleteMode>) {
        this.deleteMode = deleteMode;
        if (selectOrEntity instanceof SelectExpression) {
            selectOrEntity = selectOrEntity;
        } else {
            selectOrEntity = new SelectExpression(selectOrEntity);
        }
        this.select = selectOrEntity;
        for (const o of this.select.includes) {
            const childDeleteExp = new DeleteExpression(o.child, this.deleteMode);
            childDeleteExp.paramExps = childDeleteExp.paramExps.concat(this.paramExps);
            this.addInclude(childDeleteExp, o.relation);
        }
        this.select.includes = [];
    }
    public deleteMode?: IExpression<DeleteMode>;
    public includes: Array<IDeleteIncludeRelation<T, any>> = [];
    public parentRelation: IDeleteIncludeRelation<any, T>;
    public select: SelectExpression<T>;
    public addInclude<TChild>(child: DeleteExpression<TChild>, relationMeta: RelationMetaData<T, TChild>): IDeleteIncludeRelation<T, TChild>;
    public addInclude<TChild>(child: DeleteExpression<TChild>, relations: IExpression<boolean>): IDeleteIncludeRelation<T, TChild>;
    public addInclude<TChild>(child: DeleteExpression<TChild>, relationMetaOrRelations: RelationMetaData<T, TChild> | IExpression<boolean>): IDeleteIncludeRelation<T, TChild> {
        let relations: IExpression<boolean>;
        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                // include to relationSelect
                let relMap = (relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                const relationDatExp = new EntityExpression(relationMeta.relationData.type, relationMeta.relationData.name, true);
                const relationDelete = new DeleteExpression(relationDatExp, this.deleteMode);
                for (const [relColMeta, parentColMeta] of relMap) {
                    const parentCol = this.entity.columns.first((o) => o.propertyName === parentColMeta.propertyName);
                    const relationCol = relationDelete.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    const logicalExp = new StrictEqualExpression(parentCol, relationCol);
                    relations = relations ? new AndExpression(relations, logicalExp) : logicalExp;
                }
                relationDelete.parentRelation = {
                    child: relationDelete,
                    parent: this,
                    relations: relations
                };
                this.includes.push(relationDelete.parentRelation);

                // include child to relationSelect
                relations = null;
                relMap = (!relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                for (const [relColMeta, childColMeta] of relMap) {
                    const relationCol = relationDelete.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    const childCol = child.entity.columns.first((o) => o.propertyName === childColMeta.propertyName);
                    const logicalExp = new StrictEqualExpression(relationCol, childCol);
                    relations = relations ? new AndExpression(relations, logicalExp) : logicalExp;
                }
                child.parentRelation = {
                    child,
                    parent: relationDelete,
                    relations: relations
                };
                relationDelete.includes.push(child.parentRelation);
                return child.parentRelation;
            }

            relations = null;
            for (const [parentColMeta, childColMeta] of relationMeta.relationMaps) {
                const parentCol = this.entity.columns.first((o) => o.propertyName === parentColMeta.propertyName);
                const childCol = child.entity.columns.first((o) => o.propertyName === childColMeta.propertyName);
                const logicalExp = new StrictEqualExpression(parentCol, childCol);
                relations = relations ? new AndExpression(relations, logicalExp) : logicalExp;
            }
        }
        else {
            relations = relationMetaOrRelations;
        }
        child.parentRelation = {
            child,
            parent: this,
            relations: relations
        };
        this.includes.push(child.parentRelation);
        return child.parentRelation;
    }
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMeta: IRelationMetaData<T, TChild>, toOneJoinType?: JoinType): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relations: IExpression<boolean>, type: JoinType): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<T, TChild> | IExpression<boolean>, type?: JoinType) {
        return this.select.addJoin(child, relationMetaOrRelations as any, type);
    }
    public addWhere(expression: IExpression<boolean>) {
        this.select.addWhere(expression);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): DeleteExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const select = resolveClone(this.select, replaceMap);
        const clone = new DeleteExpression(select, this.deleteMode);
        replaceMap.set(this, clone);
        return clone;
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes
            .union(
                this.entity.metaData.relations
                    .where((o) => o.isMaster && (o.reverseRelation.deleteOption !== "NO ACTION" && o.reverseRelation.deleteOption !== "RESTRICT"))
                    .select((o) => o.target.type)
            )
            .union(this.includes.selectMany((o) => o.child.getEffectedEntities())).distinct().toArray();
    }
    public hashCode() {
        return hashCode("DELETE", hashCodeAdd(this.deleteMode ? 0 : this.deleteMode.hashCode(), this.select.hashCode()));
    }
    public setOrder(orders: IOrderExpression[]): void;
    public setOrder(expression: IExpression<any>, direction: OrderDirection): void;
    public setOrder(expression: IOrderExpression[] | IExpression<any>, direction?: OrderDirection) {
        this.select.setOrder(expression as any, direction);
    }
    public toString(): string {
        return `Delete({
Entity:${this.entity.toString()},
Where:${this.where ? this.where.toString() : ""},
Mode:${this.deleteMode}
})`;
    }
}
