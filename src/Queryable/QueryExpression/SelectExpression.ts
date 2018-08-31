import { GenericType, OrderDirection, JoinType, RelationshipType, IObjectType } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryCommandExpression } from "./IQueryCommandExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { Enumerable } from "../../Enumerable/Enumerable";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { RelationDataExpression } from "./RelationDataExpression";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { IPagingExpression } from "./IPagingExpression";
import { EntityExpression } from "./EntityExpression";
import { SqlParameterExpression } from "../../ExpressionBuilder/Expression/SqlParameterExpression";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { ValueExpressionTransformer } from "../../ExpressionBuilder/ValueExpressionTransformer";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { hashCode } from "../../Helper/Util";
export interface IIncludeRelation<T = any, TChild = any> {
    child: SelectExpression<TChild>;
    parent: SelectExpression<T>;
    relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>;
    type: RelationshipType;
    name: string;
}
export interface IJoinRelation<T = any, TChild = any> {
    child: SelectExpression<TChild>;
    parent: SelectExpression<T>;
    relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>;
    type: JoinType;
}
export class SelectExpression<T = any> implements IQueryCommandExpression<T> {
    [prop: string]: any;
    public selects: IColumnExpression[] = [];
    private isSelectAll = true;
    public distinct: boolean;
    public isAggregate: boolean;
    public entity: IEntityExpression<T>;
    public get type() {
        return Array;
    }
    public paging: IPagingExpression = {};
    public where: IExpression<boolean>;
    public orders: IOrderExpression[] = [];
    public itemExpression: IExpression;
    public get itemType(): GenericType<any> {
        return this.itemExpression.type;
    }
    public includes: IIncludeRelation<T, any>[] = [];
    public joins: IJoinRelation<T, any>[] = [];
    public parentRelation: IJoinRelation<any, T> | IIncludeRelation<any, T>;
    public getVisitParam(): IExpression {
        return this.entity;
    }
    public parameters: SqlParameterExpression[] = [];
    constructor(entity: IEntityExpression<T>) {
        this.entity = entity;
        this.itemExpression = entity;

        if (entity instanceof ProjectionEntityExpression) {
            this.selects = entity.selectedColumns.slice(0);
            this.relationColumns = entity.relationColumns.slice(0);
        }
        else
            this.selects = entity.columns.where(o => o.columnMetaData && o.columnMetaData.isProjected).toArray();
        this.isSelectAll = true;
        entity.select = this;
        this.orders = entity.defaultOrders.slice(0);
        if (entity.deleteColumn)
            this.addWhere(new StrictEqualExpression(entity.deleteColumn, new ValueExpression(false)));
    }
    public get projectedColumns(): Enumerable<IColumnExpression<T>> {
        if (this.isAggregate)
            return this.selects.asEnumerable();
        const defColumns = this.entity.primaryColumns.union(this.relationColumns);
        // Version column is a must when select an Entity
        if (this.entity instanceof EntityExpression) {
            defColumns.union([this.entity.versionColumn]);
        }
        return defColumns.union(this.selects);
    }
    public relationColumns: IColumnExpression[] = [];
    public addWhere(expression: IExpression<boolean>) {
        this.where = this.where ? new AndExpression(this.where, expression) : expression;
    }
    public addOrder(orders: IOrderExpression[]): void;
    public addOrder(expression: IExpression<any>, direction: OrderDirection): void;
    public addOrder(expression: IExpression<any> | IOrderExpression[], direction?: OrderDirection) {
        if (Array.isArray(expression)) {
            this.orders = this.orders.concat(expression);
        }
        else {
            this.orders.push({
                column: expression,
                direction: direction
            });
        }
    }
    public addInclude<TChild>(name: string, child: SelectExpression<TChild>, relationMeta: RelationMetaData<T, TChild>): IIncludeRelation<T, TChild>;
    public addInclude<TChild>(name: string, child: SelectExpression<TChild>, relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type: RelationshipType): IIncludeRelation<T, TChild>;
    public addInclude<TChild>(name: string, child: SelectExpression<TChild>, relationMetaOrRelations: RelationMetaData<T, TChild> | Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type?: RelationshipType): IIncludeRelation<T, TChild> {
        let relationMap: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>;
        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                // include to relationSelect
                relationMap = new Map();
                let relMap = (relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                let relationSelect = new SelectExpression(new RelationDataExpression(relationMeta.relationData.type, relationMeta.relationData.name));
                relationSelect.distinct = true;
                for (const [relColMeta, parentColMeta] of relMap) {
                    const parentCol = this.entity.columns.first((o) => o.propertyName === parentColMeta.propertyName);
                    const relationCol = relationSelect.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    if (!parentCol.isPrimary) this.relationColumns.add(parentCol);
                    if (!relationCol.isPrimary) relationSelect.relationColumns.add(relationCol);
                    relationMap.set(parentCol, relationCol);
                }
                relationSelect.parentRelation = {
                    name,
                    child: relationSelect,
                    parent: this,
                    relations: relationMap,
                    type: "many"
                };
                this.includes.push(relationSelect.parentRelation);
                relationSelect.distinct = true;

                // include child to relationSelect
                relationMap = new Map();
                relMap = (!relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                for (const [relColMeta, childColMeta] of relMap) {
                    const relationCol = relationSelect.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    const childCol = child.entity.columns.first((o) => o.propertyName === childColMeta.propertyName);
                    if (!relationCol.isPrimary) this.relationColumns.add(relationCol);
                    if (!childCol.isPrimary) child.relationColumns.add(childCol);
                    relationMap.set(relationCol, childCol);
                }
                child.parentRelation = {
                    name,
                    child,
                    parent: relationSelect,
                    relations: relationMap,
                    type: "one"
                };
                relationSelect.includes.push(child.parentRelation);
                child.distinct = true;
                return child.parentRelation;
            }

            relationMap = new Map();
            for (const [parentColMeta, childColMeta] of relationMeta.relationMaps) {
                const parentCol = this.entity.columns.first((o) => o.propertyName === parentColMeta.propertyName);
                const childCol = child.entity.columns.first((o) => o.propertyName === childColMeta.propertyName);
                if (!parentCol.isPrimary) this.relationColumns.add(parentCol);
                if (!childCol.isPrimary) child.relationColumns.add(childCol);
                relationMap.set(parentCol, childCol);
            }
            type = relationMeta.relationType;

            // if it many-* relation, set distinct to avoid duplicate records
            child.distinct = relationMeta.reverseRelation.relationType === "many";
        }
        else {
            relationMap = relationMetaOrRelations as any;
            for (const [parentCol, childCol] of relationMap) {
                if (!parentCol.isPrimary) this.relationColumns.add(parentCol);
                if (!childCol.isPrimary) child.relationColumns.add(childCol);
            }
            // always distinct to avoid getting duplicate entry
            child.distinct = true;
        }
        child.parentRelation = {
            name,
            child,
            parent: this,
            relations: relationMap,
            type: type!
        };
        this.includes.push(child.parentRelation);
        return child.parentRelation;
    }
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relationMeta: IRelationMetaData<T, TChild>, toOneJoinType?: JoinType): IJoinRelation<T, any>;
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type: JoinType): IJoinRelation<T, any>;
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<T, TChild> | Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type?: JoinType) {
        let relationMap: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>;
        const existingRelation = this.joins.first((o) => o.child === child);
        if (existingRelation)
            return existingRelation;

        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                // include to relationSelect
                relationMap = new Map();
                let relMap = (relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                let relationSelect = new SelectExpression(new RelationDataExpression(relationMeta.relationData.type, relationMeta.relationData.name));
                for (const [relColMeta, parentColMeta] of relMap) {
                    const parentCol = this.entity.columns.first((o) => o.propertyName === parentColMeta.propertyName);
                    const relationCol = relationSelect.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    if (!relationCol.isPrimary) relationSelect.relationColumns.add(relationCol);
                    relationMap.set(parentCol, relationCol);
                }
                relationSelect.parentRelation = {
                    child: relationSelect,
                    parent: this,
                    relations: relationMap,
                    type: JoinType.LEFT
                };
                this.joins.push(relationSelect.parentRelation);

                relationMap.clear();
                // include child to relationSelect
                relMap = (!relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                for (const [relColMeta, childColMeta] of relMap) {
                    const relationCol = relationSelect.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    const childCol = child.entity.columns.first((o) => o.propertyName === childColMeta.propertyName);
                    if (!childCol.isPrimary) child.relationColumns.add(childCol);
                    relationMap.set(relationCol, childCol);
                }
                child.parentRelation = {
                    child,
                    parent: relationSelect,
                    relations: relationMap,
                    type: JoinType.INNER
                };
                relationSelect.joins.push(child.parentRelation);
                return child.parentRelation;
            }
            else {
                const relType = relationMeta.source.type === this.entity.type ? relationMeta.relationType : relationMeta.reverseRelation.relationType;
                type = relType === "one" ? type ? type : JoinType.INNER : JoinType.LEFT;
                relationMap = new Map();
                const isReverse = relationMeta.source.type !== this.entity.type;
                for (const [parentColMeta, childColMeta] of relationMeta.relationMaps) {
                    const parentCol = this.entity.columns.first((o) => o.propertyName === (isReverse ? childColMeta : parentColMeta).propertyName);
                    const childCol = child.entity.columns.first((o) => o.propertyName === (isReverse ? parentColMeta : childColMeta).propertyName);
                    if (!childCol.isPrimary) child.relationColumns.add(childCol);
                    relationMap.set(parentCol, childCol);
                }
            }
        }
        else {
            relationMap = relationMetaOrRelations as any;
            for (const [, childCol] of relationMap) {
                if (!childCol.isPrimary) child.relationColumns.add(childCol);
            }
        }

        child.parentRelation = {
            child: child,
            parent: this,
            relations: relationMap,
            type: type
        };
        this.joins.push(child.parentRelation);
        return child.parentRelation;
    }
    public clone(entity?: IEntityExpression): SelectExpression<T> {
        const clone = new SelectExpression(entity ? entity : this.entity.clone());
        if (this.itemExpression !== this.entity)
            clone.itemExpression = this.itemExpression;
        clone.orders = this.orders.slice(0);
        clone.isSelectAll = this.isSelectAll;
        clone.selects = this.selects.select(o => {
            let col = clone.entity.columns.first(c => c.columnName === o.columnName);
            if (!col) {
                col = o.clone();
                col.entity = clone.entity;
            }
            return col;
        }).toArray();

        for (const join of this.joins) {
            const child = join.child.clone();
            const relationMap = new Map();
            for (const [parentCol, childCol] of join.relations) {
                const cloneCol = clone.entity.columns.first(c => c.columnName === parentCol.columnName);
                const cloneChildCol = child.entity.columns.first(c => c.columnName === childCol.columnName);
                relationMap.set(cloneCol, cloneChildCol);
            }
            clone.addJoinRelation(child, relationMap, join.type);
        }
        for (const include of this.includes) {
            const child = include.child.clone();
            const relationMap = new Map();
            for (const [parentCol, childCol] of include.relations) {
                let cloneCol = clone.entity.columns.first(c => c.columnName === parentCol.columnName);
                if (!cloneCol) {
                    const join = clone.joins.first(o => o.child.entity.type === parentCol.entity.type);
                    cloneCol = join.child.entity.columns.first(c => c.columnName === parentCol.columnName);
                }
                relationMap.set(cloneCol, childCol);
            }
            clone.addInclude(include.name, child, relationMap, include.type);
        }
        if (this.where)
            clone.where = this.where.clone();
        Object.assign(clone.paging, this.paging);
        return clone;
    }
    public toQueryCommands(queryBuilder: QueryBuilder, parameters?: ISqlParameter[]): IQuery[] {
        if (parameters)
            queryBuilder.setParameters(parameters);
        return queryBuilder.getSelectQuery(this);
    }
    public execute(queryBuilder: QueryBuilder) {
        return this as any;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return this.toQueryCommands(queryBuilder).select(o => o.query).toArray().join(";\n\n");
    }
    public clearDefaultColumns() {
        if (this.isSelectAll) {
            this.isSelectAll = false;
            for (const column of this.entity.columns.where(o => o.columnMetaData && o.columnMetaData.isProjected))
                this.selects.remove(column);
        }
    }
    public isSimple() {
        return !this.where &&
            !this.paging.skip && !this.paging.take &&
            this.selects.length === this.entity.columns.length &&
            this.selects.all((c) => this.entity.columns.contains(c));
    }
    public buildParameter(params: { [key: string]: any }): ISqlParameter[] {
        const result: ISqlParameter[] = [];
        const valueTransformer = new ValueExpressionTransformer(params);
        for (const sqlParameter of this.parameters) {
            const value = sqlParameter.valueGetter.execute(valueTransformer);
            result.push({
                name: sqlParameter.name,
                parameter: sqlParameter,
                value: value
            });
        }
        return result;
    }
    public hashCode() {
        let code: number = hashCode("SELECT", hashCode(this.entity.name, this.distinct ? 1 : 0));
        code = ((code << 5) - code + this.selects.select(o => o.hashCode()).sum()) | 0;
        code = hashCode(this.where.toString(), code);
        code = ((code << 5) - code + this.joins.sum(o => o.child.hashCode())) | 0;
        code = ((code << 5) - code + this.includes.sum(o => o.child.hashCode())) | 0;
        return code;
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes
            .union(this.joins.selectMany(o => o.child.getEffectedEntities()))
            .union(this.includes.selectMany(o => o.child.getEffectedEntities()))
            .distinct().toArray();
    }
}
