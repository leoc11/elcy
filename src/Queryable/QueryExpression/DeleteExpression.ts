import { OrderDirection, JoinType, DeleteMode, IObjectType } from "../../Common/Type";
import { IQueryExpression } from "./IQueryExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { SelectExpression } from "./SelectExpression";
import { hashCode, resolveClone, hashCodeAdd } from "../../Helper/Util";
import { EntityExpression } from "./EntityExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { JoinRelation } from "../Interface/JoinRelation";
import { IQueryOption } from "../../Query/IQueryOption";
export interface IDeleteIncludeRelation<T = any, TChild = any> {
    child: DeleteExpression<TChild>;
    parent: IQueryExpression<T>;
    relations: IExpression<boolean>;
}
export class DeleteExpression<T = any> implements IQueryExpression<void> {
    public option: IQueryOption;
    public deleteMode?: IExpression<DeleteMode>;
    public includes: IDeleteIncludeRelation<T, any>[] = [];
    public parentRelation: IDeleteIncludeRelation<any, T>;
    public select: SelectExpression<T>;
    public get paramExps() {
        return this.select.paramExps;
    }
    public set paramExps(value) {
        this.select.paramExps = value;
    }
    public get joins() {
        return this.select.joins;
    }
    public get type() {
        return undefined as any;
    }
    public get entity() {
        return this.select.entity as EntityExpression<T>;
    }
    public get paging() {
        return this.select.paging;
    }
    public get orders() {
        return this.select.orders;
    }
    public get where() {
        return this.select.where;
    }
    constructor(entity: IEntityExpression<T>, deleteMode?: IExpression<DeleteMode>);
    constructor(select: SelectExpression<T>, deleteMode?: IExpression<DeleteMode>);
    constructor(selectOrEntity: IEntityExpression<T> | SelectExpression<T>, deleteMode?: IExpression<DeleteMode>) {
        this.option = {};
        this.deleteMode = deleteMode;
        if (selectOrEntity instanceof SelectExpression) {
            selectOrEntity = selectOrEntity;
        } else {
            selectOrEntity = new SelectExpression(selectOrEntity);
        }
        this.select = selectOrEntity;
        this.select.includes.each(o => {
            const childDeleteExp = new DeleteExpression(o.child, this.deleteMode);
            childDeleteExp.paramExps = childDeleteExp.paramExps.concat(this.paramExps);
            this.addInclude(childDeleteExp, o.relation);
        });
        this.select.includes = [];
    }
    public addWhere(expression: IExpression<boolean>) {
        this.select.addWhere(expression);
    }
    public addOrder(orders: IOrderExpression[]): void;
    public addOrder(expression: IExpression<any>, direction: OrderDirection): void;
    public addOrder(expression: IOrderExpression[] | IExpression<any>, direction?: OrderDirection) {
        this.select.addOrder(expression as any, direction);
    }
    public addInclude<TChild>(child: DeleteExpression<TChild>, relationMeta: RelationMetaData<T, TChild>): IDeleteIncludeRelation<T, TChild>;
    public addInclude<TChild>(child: DeleteExpression<TChild>, relations: IExpression<boolean>): IDeleteIncludeRelation<T, TChild>;
    public addInclude<TChild>(child: DeleteExpression<TChild>, relationMetaOrRelations: RelationMetaData<T, TChild> | IExpression<boolean>): IDeleteIncludeRelation<T, TChild> {
        let relations: IExpression<boolean>;
        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                // include to relationSelect
                let relMap = (relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                let relationDatExp = new EntityExpression(relationMeta.relationData.type, relationMeta.relationData.name, true);
                let relationDelete = new DeleteExpression(relationDatExp, this.deleteMode);
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
    public clone(replaceMap?: Map<IExpression, IExpression>): DeleteExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const select = resolveClone(this.select, replaceMap);
        const clone = new DeleteExpression(select, this.deleteMode);
        replaceMap.set(this, clone);
        return clone;
    }
    public toString(): string {
        return `Delete({
Entity:${this.entity.toString()},
Where:${this.where ? this.where.toString() : ""},
Mode:${this.deleteMode}
})`;
    }
    public hashCode() {
        return hashCode("DELETE", hashCodeAdd(this.deleteMode ? 0 : this.deleteMode.hashCode(), this.select.hashCode()));
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes
            .union(
                this.entity.metaData.relations
                    .where(o => o.isMaster && (o.reverseRelation.deleteOption !== "NO ACTION" && o.reverseRelation.deleteOption !== "RESTRICT"))
                    .select(o => o.target.type)
            )
            .union(this.includes.selectMany(o => o.child.getEffectedEntities())).distinct().toArray();
    }
}
