import { Enumerable } from "@elcy/enumerable";
import { JoinType, OrderDirection } from "../../Common/StringType";
import { IObjectType } from "../../Common/Type";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { hashCode, resolveClone } from "../../Helper/Util";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { JoinRelation } from "../Interface/JoinRelation";
import { EntityExpression } from "./EntityExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { IQueryExpression } from "./IQueryExpression";
import { IQueryIncludeRelation } from "./IQueryIncludeRelation";
import { SelectExpression } from "./SelectExpression";

export interface IDeleteIncludeRelation<T extends object = any, TChild extends object = any> extends IQueryIncludeRelation<T, TChild, DeleteExpression<TChild>, DeleteExpression<T>> { }
export class DeleteExpression<TE extends object = object> implements IQueryExpression<TE> {
    public get entity() {
        return this.select.entity as EntityExpression<TE>;
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
        return undefined as IObjectType<void>;
    }
    public get where() {
        return this.select.where;
    }
    constructor(entity: IEntityExpression<TE>);
    constructor(select: SelectExpression<TE>);
    constructor(selectOrEntity: IEntityExpression<TE> | SelectExpression<TE>) {
        if (selectOrEntity instanceof SelectExpression) {
            selectOrEntity = selectOrEntity;
        } else {
            selectOrEntity = new SelectExpression(selectOrEntity);
        }
        this.select = selectOrEntity;
        for (const o of this.select.includes) {
            const childDeleteExp = new DeleteExpression(o.child);
            childDeleteExp.paramExps = childDeleteExp.paramExps.concat(this.paramExps);
            this.addInclude(childDeleteExp, o.relation);
        }
        this.select.includes = [];
    }
    public includes: Array<IDeleteIncludeRelation<TE>> = [];
    public parentRelation: IDeleteIncludeRelation<any, TE>;
    public select: SelectExpression<TE>;
    public addInclude<TChild extends object>(child: DeleteExpression<TChild>, relationMeta: RelationMetaData<TE, TChild>): IDeleteIncludeRelation<TE, TChild>;
    public addInclude<TChild extends object>(child: DeleteExpression<TChild>, relations: IExpression<boolean>): IDeleteIncludeRelation<TE, TChild>;
    public addInclude<TChild extends object>(child: DeleteExpression<TChild>, relationMetaOrRelations: RelationMetaData<TE, TChild> | IExpression<boolean>): IDeleteIncludeRelation<TE, TChild> {
        let relations: IExpression<boolean>;
        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                throw new Error("many-many relation not supported");
            }

            const relExp = new AndExpression();
            for (const [parentColMeta, childColMeta] of relationMeta.relationMaps) {
                const parentCol = this.entity.columns.find((o) => o.propertyName === parentColMeta.propertyName);
                const childCol = child.entity.columns.find((o) => o.propertyName === childColMeta.propertyName);
                const logicalExp = new StrictEqualExpression(parentCol, childCol);
                relExp.operands.push(logicalExp);
            }
            relations = relExp.asOperand();
        }
        else {
            relations = relationMetaOrRelations;
        }
        const deleteRelation: IDeleteIncludeRelation<TE, TChild> = {
            child: child,
            parent: this,
            relation: relations
        };
        child.parentRelation = deleteRelation;
        this.includes.push(deleteRelation);
        return deleteRelation;
    }
    public addJoin<TChild extends object>(child: SelectExpression<TChild>, relationMeta: IRelationMetaData<TE, TChild>, toOneJoinType?: JoinType): JoinRelation<TE, any>;
    public addJoin<TChild extends object>(child: SelectExpression<TChild>, relations: IExpression<boolean>, type: JoinType): JoinRelation<TE, any>;
    public addJoin<TChild extends object>(child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<TE, TChild> | IExpression<boolean>, type?: JoinType) {
        return this.select.addJoin(child, relationMetaOrRelations as IExpression<boolean>, type);
    }
    public addWhere(expression: IExpression<boolean>) {
        this.select.addWhere(expression);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): DeleteExpression<TE> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const select = resolveClone(this.select, replaceMap);
        const clone = new DeleteExpression(select);
        replaceMap.set(this, clone);
        return clone;
    }
    public getEffectedEntities(): IObjectType[] {
        return Enumerable.from(this.entity.entityTypes)
            .concat(
                this.entity.metaData.relations
                    .filter((o) => o.isMaster && (o.reverseRelation.deleteOption !== "NO ACTION" && o.reverseRelation.deleteOption !== "RESTRICT"))
                    .map((o) => o.target.type)
            )
            .concat(this.includes.flatMap((o) => o.child.getEffectedEntities())).distinct().toArray();
    }
    public hashCode() {
        return hashCode("DELETE", this.select.hashCode());
    }
    public setOrder(orders: IOrderExpression[]): void;
    public setOrder(expression: IExpression<unknown>, direction: OrderDirection): void;
    public setOrder(expression: IOrderExpression[] | IExpression<unknown>, direction?: OrderDirection) {
        this.select.setOrder(expression as IExpression<unknown>, direction);
    }
    public toString(): string {
        return `Delete({
Entity:${this.entity.toString()},
Where:${this.where ? this.where.toString() : ""}
})`;
    }
}
