import { OrderDirection, JoinType, DeleteMode, IObjectType } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryCommandExpression } from "./IQueryCommandExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { RelationDataExpression } from "./RelationDataExpression";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { SelectExpression, IJoinRelation } from "./SelectExpression";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { hashCode } from "../../Helper/Util";
import { EntityExpression } from "./EntityExpression";
export interface IDeleteIncludeRelation<T = any, TChild = any> {
    child: DeleteExpression<TChild>;
    parent: IQueryCommandExpression<T>;
    relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>;
}
export class DeleteExpression<T = any> implements IQueryCommandExpression<void> {
    public deleteMode?: IExpression<DeleteMode>;
    public includes: IDeleteIncludeRelation<T, any>[] = [];
    public parentRelation: IDeleteIncludeRelation<any, T>;
    public select: SelectExpression<T>;
    public get parameters() {
        return this.select.parameters;
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
        if (selectOrEntity instanceof SelectExpression) {
            selectOrEntity = selectOrEntity.clone();
        } else {
            selectOrEntity = new SelectExpression(selectOrEntity);
        }
        this.select = selectOrEntity;
        this.select.includes.each(o => {
            this.addInclude(new DeleteExpression(o.child, this.deleteMode), o.relations);
        });
        this.select.includes = [];
        this.deleteMode = deleteMode;
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
    public addInclude<TChild>(child: DeleteExpression<TChild>, relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>): IDeleteIncludeRelation<T, TChild>;
    public addInclude<TChild>(child: DeleteExpression<TChild>, relationMetaOrRelations: RelationMetaData<T, TChild> | Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>): IDeleteIncludeRelation<T, TChild> {
        let relationMap: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>;
        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                // include to relationSelect
                relationMap = new Map();
                let relMap = (relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                let relationDelete = new DeleteExpression(new RelationDataExpression(relationMeta.relationData.type, relationMeta.relationData.name), this.deleteMode);
                for (const [relColMeta, parentColMeta] of relMap) {
                    const parentCol = this.entity.columns.first((o) => o.propertyName === parentColMeta.propertyName);
                    const relationCol = relationDelete.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    relationMap.set(parentCol, relationCol);
                }
                relationDelete.parentRelation = {
                    child: relationDelete,
                    parent: this,
                    relations: relationMap
                };
                this.includes.push(relationDelete.parentRelation);

                // include child to relationSelect
                relationMap = new Map();
                relMap = (!relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                for (const [relColMeta, childColMeta] of relMap) {
                    const relationCol = relationDelete.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    const childCol = child.entity.columns.first((o) => o.propertyName === childColMeta.propertyName);
                    relationMap.set(relationCol, childCol);
                }
                child.parentRelation = {
                    child,
                    parent: relationDelete,
                    relations: relationMap
                };
                relationDelete.includes.push(child.parentRelation);
                return child.parentRelation;
            }

            relationMap = new Map();
            for (const [parentColMeta, childColMeta] of relationMeta.relationMaps) {
                const parentCol = this.entity.columns.first((o) => o.propertyName === parentColMeta.propertyName);
                const childCol = child.entity.columns.first((o) => o.propertyName === childColMeta.propertyName);
                relationMap.set(parentCol, childCol);
            }
        }
        else {
            relationMap = relationMetaOrRelations as any;
        }
        child.parentRelation = {
            child,
            parent: this,
            relations: relationMap
        };
        this.includes.push(child.parentRelation);
        return child.parentRelation;
    }
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relationMeta: IRelationMetaData<T, TChild>, toOneJoinType?: JoinType): IJoinRelation<T, any>;
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type: JoinType): IJoinRelation<T, any>;
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<T, TChild> | Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type?: JoinType) {
        return this.select.addJoinRelation(child, relationMetaOrRelations as any, type);
    }
    public clone(): DeleteExpression<T> {
        const clone = new DeleteExpression(this.select, this.deleteMode);
        return clone;
    }
    public toQueryCommands(queryBuilder: QueryBuilder, parameters?: ISqlParameter[]): IQuery[] {
        queryBuilder.setParameters(parameters);
        return queryBuilder.getBulkDeleteQuery(this);
    }
    public execute() {
        return this as any;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return this.toQueryCommands(queryBuilder).select(o => o.query).toArray().join(";" + queryBuilder.newLine() + queryBuilder.newLine());
    }
    public buildParameter(paramStacks: Array<{ [key: string]: any }>): ISqlParameter[] {
        return this.select.buildParameter(paramStacks);
    }
    public hashCode() {
        return hashCode("DELETE", hashCode(this.deleteMode ? "" : this.deleteMode.toString(), this.select.hashCode()));
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
