import { GenericType, OrderDirection, JoinType, RelationshipType, IObjectType } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryCommandExpression } from "./IQueryCommandExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { IPagingExpression } from "./IPagingExpression";
import { EntityExpression } from "./EntityExpression";
import { SqlParameterExpression } from "../../ExpressionBuilder/Expression/SqlParameterExpression";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { ValueExpressionTransformer } from "../../ExpressionBuilder/ValueExpressionTransformer";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { hashCode, hashCodeAdd, resolveClone, visitExpression, mapReplaceExp, mapKeepExp, isColumnExp } from "../../Helper/Util";
import { ISelectRelation } from "../Interface/ISelectRelation";
import { IncludeRelation } from "../Interface/IncludeRelation";
import { JoinRelation } from "../Interface/JoinRelation";
import { IBaseRelationMetaData } from "../../MetaData/Interface/IBaseRelationMetaData";
import { EmbeddedRelationMetaData } from "../../MetaData/EmbeddedColumnMetaData";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { Enumerable } from "../../Enumerable/Enumerable";

export class SelectExpression<T = any> implements IQueryCommandExpression<T> {
    constructor(entity?: IEntityExpression<T>) {
        if (entity) {
            this.entity = entity;
            this.itemExpression = entity;

            if (entity instanceof ProjectionEntityExpression) {
                this.selects = entity.columns.slice(0);
                // TODO:
                // this.selects = entity.selectedColumns.slice(0);
                // this.relationColumns = entity.relationColumns.slice(0);
            }
            else
                this.selects = entity.columns.where(o => o.columnMetaData && o.columnMetaData.isProjected).toArray();
            entity.select = this;
        }
    }

    //#region Properties
    public entity: IEntityExpression<T>;
    public type = Array;
    public get itemType(): GenericType<any> {
        return this.itemExpression.type;
    }
    public itemExpression: IExpression;

    public selects: IColumnExpression[] = [];
    public get projectedColumns(): Iterable<IColumnExpression<T>> {
        if (this.distinct) {
            return Enumerable.load(this.relationColumns).union(this.resolvedSelects);
        }

        // primary column used in hydration to identify an entity.
        // relation column used in hydration to build relationship.
        let projectedColumns = this.primaryKeys.union(this.relationColumns);
        if (this.entity instanceof EntityExpression && this.entity.versionColumn && this.entity.metaData.concurencyModel === "OPTIMISTIC VERSION") {
            // Version column for optimistic concurency.
            projectedColumns = projectedColumns.union([this.entity.versionColumn]);
        }
        projectedColumns = projectedColumns.union(this.resolvedSelects);

        return projectedColumns;
    }
    public get primaryKeys() {
        return this.entity.primaryColumns;
    }
    public distinct: boolean;
    public where: IExpression<boolean>;
    public orders: IOrderExpression[] = [];
    public paging: IPagingExpression = {};

    public parentRelation: ISelectRelation<any, T>;
    public includes: IncludeRelation<T, any>[] = [];
    public joins: JoinRelation<T, any>[] = [];
    public isSubSelect: boolean;
    public parameters: SqlParameterExpression[] = [];

    public get relationColumns(): Iterable<IColumnExpression> {
        // Include Relation Columns are used later for hydration
        let relations = this.includes.where(o => !o.isEmbedded).selectMany(o => o.parentColumns);
        if (this.parentRelation) {
            // relation column might cames from child join columns
            relations = relations.union(this.parentRelation.childColumns);
        }
        return relations;
    }
    public get resolvedSelects() {
        let selects = this.selects.asEnumerable();
        for (const include of this.includes) {
            if (include.isEmbedded) {
                const cloneMap = new Map();
                mapReplaceExp(cloneMap, include.child.entity, this.entity);
                // add column which include in emdedded relation
                const childSelects = include.child.resolvedSelects.select(o => {
                    let curCol = this.entity.columns.first(c => c.propertyName === o.propertyName);
                    if (!curCol) curCol = o.clone(cloneMap);
                    return curCol;
                });
                selects = selects.union(childSelects);
            }
            else {
                selects = selects.union(include.parentColumns);
            }
        }
        return selects;
    }
    public get allColumns() {
        let columns = this.entity.columns.union(this.resolvedSelects);
        for (const join of this.joins) {
            const child = join.child;
            columns = child.entity.columns.union(child.resolvedSelects);
        }
        for (const include of this.includes.where(o => o.isEmbedded)) {
            const child = include.child;
            columns = child.entity.columns.union(child.resolvedSelects);
        }
        return columns;
    }
    public get resolvedIncludes(): Iterable<IncludeRelation<T>> {
        return this.includes.selectMany(o => {
            if (o.isEmbedded) {
                return o.child.resolvedIncludes;
            }
            else
                return [o];
        });
    }
    public get resolvedJoins(): Iterable<JoinRelation<T>> {
        let joins = this.joins.asEnumerable();
        for (const include of this.includes.where(o => o.isEmbedded)) {
            joins = joins.union(include.child.resolvedJoins);
        }
        return joins;
    }

    //#endregion

    //#region Methods
    public addWhere(expression: IExpression<boolean>) {
        if (this.isSubSelect) {
            if (expression instanceof AndExpression) {
                this.addWhere(expression.leftOperand);
                this.addWhere(expression.rightOperand);
                return;
            }

            let isRelationFilter = false;
            visitExpression(expression, (exp): boolean | void => {
                if ((exp as IColumnExpression).entity) {
                    const colExp = exp as IColumnExpression;
                    if (colExp.entity !== this.entity) {
                        isRelationFilter = true;
                        return false;
                    }
                }
            });

            if (isRelationFilter) {
                this.parentRelation.relations = this.parentRelation.relations ? new AndExpression(this.parentRelation.relations, expression) : expression;
                return;
            }
        }

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
    public addInclude<TChild>(name: string, child: SelectExpression<TChild>, relationMeta: IBaseRelationMetaData<T, TChild>): IncludeRelation<T, TChild>;
    public addInclude<TChild>(name: string, child: SelectExpression<TChild>, relations: IExpression<boolean>, type: RelationshipType, isEmbedded?: boolean): IncludeRelation<T, TChild>;
    public addInclude<TChild>(name: string, child: SelectExpression<TChild>, relationMetaOrRelations: IBaseRelationMetaData<T, TChild> | IExpression<boolean>, type?: RelationshipType, isEmbedded?: boolean): IncludeRelation<T, TChild> {
        let relation: IExpression<boolean>;
        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                // add bridge (a.k.a relation data) and include child select to it.
                const relDataEntityExp = new EntityExpression(relationMeta.relationData.type, relationMeta.relationData.name, true);
                let relDataExp = new SelectExpression(relDataEntityExp);

                // predicate that identify relation between bridge and child.
                let bridgeRelation: IExpression<boolean>;
                let bridgeRelationMap = (relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                for (const [relColMeta, parentColMeta] of bridgeRelationMap) {
                    const parentCol = this.entity.columns.first((o) => o.propertyName === parentColMeta.propertyName);
                    const relationCol = relDataExp.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);

                    const logicalExp = new StrictEqualExpression(parentCol, relationCol);
                    bridgeRelation = bridgeRelation ? new AndExpression(bridgeRelation, logicalExp) : logicalExp;
                }

                this.addInclude(name, relDataExp, bridgeRelation, "many");

                // add relation from this to bridge.
                bridgeRelationMap = (!relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                bridgeRelation = null;
                for (const [relColMeta, childColMeta] of bridgeRelationMap) {
                    const bridgeCol = relDataEntityExp.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    const childCol = child.entity.columns.first((o) => o.propertyName === childColMeta.propertyName);

                    const logicalExp = new StrictEqualExpression(bridgeCol, childCol);
                    bridgeRelation = bridgeRelation ? new AndExpression(bridgeRelation, logicalExp) : logicalExp;
                }

                const result = relDataExp.addInclude(name, child, bridgeRelation, "one");
                return result;
            }

            for (const [parentColMeta, childColMeta] of relationMeta.relationMaps) {
                const parentCol = this.entity.columns.first((o) => o.propertyName === parentColMeta.propertyName);
                const childCol = child.entity.columns.first((o) => o.propertyName === childColMeta.propertyName);
                const logicalExp = new StrictEqualExpression(parentCol, childCol);
                relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
            }
            type = relationMeta.relationType;

            // this.addInclude(name, child, relation, type);
            // TODO: REMOVE COZ NO LONGER NEED. INCLUDE WILL ALWAYS UNIQUE PER RECORDS
            // if it many-* relation, set distinct to avoid duplicate records
            // child.distinct = relationMeta.reverseRelation.relationType === "many";
        }
        else if (relationMetaOrRelations instanceof EmbeddedRelationMetaData) {
            type = relationMetaOrRelations.relationType;
            relation = new ValueExpression(true);
            isEmbedded = true;
        }
        else {
            relation = relationMetaOrRelations as any;
            // TODO: REMOVE.
            // if (!relation) {
            //     relation = new StrictEqualExpression(new ValueExpression(true), new ValueExpression(true));
            // }

            // visitExpression(relation, (exp: IExpression): void | boolean => {
            //     const colExp = exp as IColumnExpression;
            //     if (colExp.entity && !colExp.isPrimary) {
            //         if (this.entity.columns.contains(colExp)) {
            //             this.relationColumns.add(colExp);
            //         }
            //         if (child.entity.columns.contains(colExp)) {
            //             child.relationColumns.add(colExp);
            //         }
            //         return false;
            //     }
            // });
            // // always distinct to avoid getting duplicate entry
            // child.distinct = true;
        }

        const includeRel = new IncludeRelation(this, child, name, type, relation);
        includeRel.isEmbedded = isEmbedded;
        child.parentRelation = includeRel;
        this.includes.push(includeRel);
        return includeRel;
    }
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMeta: IBaseRelationMetaData<T, TChild>): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relations: IExpression<boolean>, type: JoinType, isEmbedded?: boolean): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IBaseRelationMetaData<T, TChild> | IExpression<boolean>, type?: JoinType, isEmbedded?: boolean) {
        const existingRelation = this.joins.first((o) => o.child === child);
        if (existingRelation)
            return existingRelation;

        let relation: IExpression<boolean>;
        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                // add bridge (a.k.a relation data) and join child select to it.
                const relDataEntityExp = new EntityExpression(relationMeta.relationData.type, relationMeta.relationData.name, true);
                let relDataExp = new SelectExpression(relDataEntityExp);
                relDataExp.distinct = true;

                // predicate that identify relation between bridge and child.
                let bridgeRelation: IExpression<boolean>;
                let bridgeRelationMap = (relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                for (const [relColMeta, parentColMeta] of bridgeRelationMap) {
                    const parentCol = this.entity.columns.first((o) => o.propertyName === parentColMeta.propertyName);
                    const relationCol = relDataExp.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);

                    const logicalExp = new StrictEqualExpression(parentCol, relationCol);
                    bridgeRelation = bridgeRelation ? new AndExpression(bridgeRelation, logicalExp) : logicalExp;
                }

                this.addJoin(relDataExp, bridgeRelation, "LEFT");

                // add relation from this to bridge.
                bridgeRelationMap = (!relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                bridgeRelation = null;
                for (const [relColMeta, childColMeta] of bridgeRelationMap) {
                    const bridgeCol = relDataEntityExp.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    const childCol = child.entity.columns.first((o) => o.propertyName === childColMeta.propertyName);

                    const logicalExp = new StrictEqualExpression(bridgeCol, childCol);
                    bridgeRelation = bridgeRelation ? new AndExpression(bridgeRelation, logicalExp) : logicalExp;
                }

                const result = relDataExp.addJoin(child, bridgeRelation, "INNER");
                return result;
            }

            const isReverse = relationMeta.source.type !== this.entity.type;
            const relType = isReverse ? relationMeta.reverseRelation.relationType : relationMeta.relationType;
            for (const [parentColMeta, childColMeta] of relationMeta.relationMaps) {
                const parentCol = this.entity.columns.first((o) => o.propertyName === (isReverse ? childColMeta : parentColMeta).propertyName);
                const childCol = child.entity.columns.first((o) => o.propertyName === (isReverse ? parentColMeta : childColMeta).propertyName);

                const logicalExp = new StrictEqualExpression(parentCol, childCol);
                relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
            }
            type = relType === "one" ? type ? type : "INNER" : "LEFT";
        }
        else if (relationMetaOrRelations instanceof EmbeddedRelationMetaData) {
            type = "INNER";
            relation = new ValueExpression(true);
            isEmbedded = true;
        }
        else {
            relation = relationMetaOrRelations as any;
        }

        const joinRel = new JoinRelation(this, child, relation, type);
        joinRel.isEmbedded = isEmbedded;
        child.parentRelation = joinRel;
        this.joins.push(joinRel);
        return joinRel;
    }
    public getVisitParam(): IExpression {
        if (isColumnExp(this.itemExpression))
            return this.itemExpression;
        return this.entity;
    }
    public buildParameter(params: { [key: string]: any }): ISqlParameter[] {
        const result: ISqlParameter[] = [];
        const valueTransformer = new ValueExpressionTransformer(params);
        for (const sqlParameter of this.parameters) {
            const value = sqlParameter.execute(valueTransformer);
            result.push({
                name: sqlParameter.name,
                parameter: sqlParameter,
                value: value
            });
        }
        return result;
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes
            .union(this.joins.selectMany(o => o.child.getEffectedEntities()))
            .union(this.includes.selectMany(o => o.child.getEffectedEntities()))
            .distinct().toArray();
    }
    /**
     * All entities used in this select expression.
     */
    public get allJoinedEntities(): Iterable<IEntityExpression> {
        return [this.entity].union(this.joins.selectMany(o => o.child.allJoinedEntities));
    }
    public isSimple() {
        return !this.where && this.joins.length === 0
            && (!this.parentRelation || this.parentRelation instanceof JoinRelation && this.parentRelation.childColumns.all((c) => this.entity.columns.contains(c)))
            && !this.paging.skip && !this.paging.take
            && this.selects.all((c) => this.entity.columns.contains(c));
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
    public hashCode() {
        let code: number = hashCode("SELECT", hashCode(this.entity.name, this.distinct ? 1 : 0));
        code = hashCodeAdd(code, this.selects.select(o => o.hashCode()).sum());
        if (this.where) code = hashCodeAdd(this.where.hashCode(), code);
        code = hashCodeAdd(code, this.joins.sum(o => o.child.hashCode()));
        code = hashCodeAdd(code, this.includes.sum(o => o.child.hashCode()));
        return code;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): SelectExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const entity = resolveClone(this.entity, replaceMap);
        const clone = new SelectExpression(entity);
        replaceMap.set(this, clone);
        clone.itemExpression = resolveClone(this.itemExpression, replaceMap);
        clone.selects = this.selects.select(o => resolveClone(o, replaceMap)).toArray();
        clone.orders = this.orders.select(o => ({
            column: resolveClone(o.column, replaceMap),
            direction: o.direction
        })).toArray();

        clone.joins = this.joins.select(o => {
            return o.clone(replaceMap);
        }).toArray();

        clone.includes = this.includes.select(o => {
            return o.clone(replaceMap);
        }).toArray();

        clone.distinct = this.distinct;
        clone.where = resolveClone(this.where, replaceMap);
        Object.assign(clone.paging, this.paging);
        return clone;
    }
    //#endregion
}
