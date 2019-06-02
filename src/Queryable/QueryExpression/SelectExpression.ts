import { JoinType, OrderDirection, RelationshipType } from "../../Common/StringType";
import { GenericType, IObjectType } from "../../Common/Type";
import { IEnumerable } from "../../Enumerable/IEnumerable";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { hashCode, hashCodeAdd, isColumnExp, mapReplaceExp, resolveClone, visitExpression } from "../../Helper/Util";
import { EmbeddedRelationMetaData } from "../../MetaData/EmbeddedColumnMetaData";
import { IBaseRelationMetaData } from "../../MetaData/Interface/IBaseRelationMetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { IncludeRelation } from "../Interface/IncludeRelation";
import { ISelectRelation } from "../Interface/ISelectRelation";
import { JoinRelation } from "../Interface/JoinRelation";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { IPagingExpression } from "./IPagingExpression";
import { IQueryExpression } from "./IQueryExpression";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";
import { SqlTableValueParameterExpression } from "./SqlTableValueParameterExpression";

export class SelectExpression<T = any> implements IQueryExpression<T> {
    public get allColumns(): IEnumerable<IColumnExpression<T>> {
        let columns = this.entity.columns.union(this.resolvedSelects);
        for (const join of this.joins) {
            const child = join.child;
            columns = child.entity.columns.union(child.resolvedSelects);
        }
        for (const include of this.includes.where((o) => o.isEmbedded)) {
            const child = include.child;
            columns = child.entity.columns.union(child.resolvedSelects);
        }
        return columns;
    }
    /**
     * All select expressions used.
     */
    public get allSelects(): IEnumerable<SelectExpression> {
        return [this as SelectExpression].union(this.joins.selectMany((o) => o.child.allSelects));
    }
    public get itemType(): GenericType<any> {
        return this.itemExpression.type;
    }
    public get primaryKeys() {
        return this.entity.primaryColumns;
    }
    public get projectedColumns(): IEnumerable<IColumnExpression<T>> {
        if (this.isSelectOnly) {
            return this.selects;
        }

        if (this.distinct) {
            return this.relationColumns.union(this.resolvedSelects);
        }

        // primary column used in hydration to identify an entity.
        // relation column used in hydration to build relationship.
        let projectedColumns = this.primaryKeys.union(this.relationColumns);
        if (this.entity instanceof EntityExpression && this.entity.versionColumn && this.entity.metaData.concurrencyMode === "OPTIMISTIC VERSION") {
            // Version column for optimistic concurency.
            projectedColumns = projectedColumns.union([this.entity.versionColumn]);
        }
        projectedColumns = projectedColumns.union(this.resolvedSelects);

        return projectedColumns;
    }

    public get relationColumns(): IEnumerable<IColumnExpression> {
        // Include Relation Columns are used later for hydration
        let relations = this.includes.where((o) => !o.isEmbedded).selectMany((o) => o.parentColumns);
        if (this.parentRelation) {
            // relation column might cames from child join columns
            relations = relations.union(this.parentRelation.childColumns);
        }
        return relations;
    }
    public get resolvedIncludes(): IEnumerable<IncludeRelation<T>> {
        return this.includes.selectMany((o) => {
            if (o.isEmbedded) {
                return o.child.resolvedIncludes;
            }
            else {
                return [o];
            }
        });
    }
    public get resolvedJoins(): IEnumerable<JoinRelation<T>> {
        let joins: IEnumerable<JoinRelation<T>> = this.joins;
        for (const include of this.includes.where((o) => o.isEmbedded)) {
            joins = joins.union(include.child.resolvedJoins);
        }
        return joins;
    }
    public get resolvedSelects(): IEnumerable<IColumnExpression> {
        let selects = this.selects.asEnumerable();
        for (const include of this.includes) {
            if (include.isEmbedded) {
                const cloneMap = new Map();
                mapReplaceExp(cloneMap, include.child.entity, this.entity);
                // add column which include in emdedded relation
                const childSelects = include.child.resolvedSelects.select((o) => {
                    let curCol = this.entity.columns.first((c) => c.propertyName === o.propertyName);
                    if (!curCol) {
                        curCol = o.clone(cloneMap);
                    }
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
    constructor(entity?: IEntityExpression<T>) {
        if (entity) {
            this.entity = entity;
            this.itemExpression = entity;

            if (entity instanceof ProjectionEntityExpression) {
                this.selects = entity.columns.slice(0);
                this.paramExps = entity.paramExps.slice(0);
            }
            else {
                this.selects = entity.columns.where((o) => o.columnMeta && o.columnMeta.isProjected).toArray();
            }
            entity.select = this;
        }
    }
    public distinct: boolean;

    //#region Properties
    public entity: IEntityExpression<T>;
    public includes: Array<IncludeRelation<T, any>> = [];
    // TODO: remove this workaround for insertInto Expression
    public isSelectOnly = false;
    public isSubSelect: boolean;
    public itemExpression: IExpression;
    public joins: Array<JoinRelation<T, any>> = [];
    public orders: IOrderExpression[] = [];
    public paging: IPagingExpression = {};
    public paramExps: SqlParameterExpression[] = [];

    public parentRelation: ISelectRelation<any, T>;
    public selects: IColumnExpression[] = [];
    public type = Array;
    public where: IExpression<boolean>;
    public addInclude<TChild>(name: string, child: SelectExpression<TChild>, relationMeta: IBaseRelationMetaData<T, TChild>): IncludeRelation<T, TChild>;
    public addInclude<TChild>(name: string, child: SelectExpression<TChild>, relations: IExpression<boolean>, type: RelationshipType, isEmbedded?: boolean): IncludeRelation<T, TChild>;
    public addInclude<TChild>(name: string, child: SelectExpression<TChild>, relationMetaOrRelations: IBaseRelationMetaData<T, TChild> | IExpression<boolean>, type?: RelationshipType, isEmbedded?: boolean): IncludeRelation<T, TChild> {
        let relation: IExpression<boolean>;
        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                // add bridge (a.k.a relation data) and include child select to it.
                const relDataEntityExp = new EntityExpression(relationMeta.relationData.type, relationMeta.relationData.name, true);
                const relDataExp = new SelectExpression(relDataEntityExp);

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
        }
        else if (relationMetaOrRelations instanceof EmbeddedRelationMetaData) {
            type = relationMetaOrRelations.relationType;
            relation = new ValueExpression(true);
            isEmbedded = true;
        }
        else {
            relation = relationMetaOrRelations as any;
        }

        const includeRel = new IncludeRelation(this, child, name, type, relation);
        includeRel.isEmbedded = isEmbedded;
        child.parentRelation = includeRel;
        this.includes.push(includeRel);
        return includeRel;
    }
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMeta: IBaseRelationMetaData<T, TChild>, type?: JoinType): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relations: IExpression<boolean>, type: JoinType, isEmbedded?: boolean): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IBaseRelationMetaData<T, TChild> | IExpression<boolean>, type?: JoinType, isEmbedded?: boolean) {
        const existingRelation = this.joins.first((o) => o.child === child);
        if (existingRelation) {
            return existingRelation;
        }

        let relation: IExpression<boolean>;
        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                // add bridge (a.k.a relation data) and join child select to it.
                const relDataEntityExp = new EntityExpression(relationMeta.relationData.type, relationMeta.relationData.name, true);
                const relDataExp = new SelectExpression(relDataEntityExp);
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
            type = relType === "one" && type ? type : "LEFT";
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
    public addSqlParameter<Tval>(valueExp: IExpression<Tval[]>, colExp?: IEntityExpression<Tval>): SqlTableValueParameterExpression<Tval>;
    public addSqlParameter<Tval>(valueExp: IExpression<Tval>, colExp?: IColumnMetaData): SqlParameterExpression<Tval>;
    public addSqlParameter<Tval>(valueExp: IExpression<Tval>, colExp?: IColumnMetaData | IEntityExpression): SqlParameterExpression<Tval> | SqlTableValueParameterExpression<Tval> {
        let paramExp: SqlParameterExpression;
        if ((valueExp.type as any) === Array) {
            paramExp = new SqlTableValueParameterExpression(valueExp as IExpression<any>, colExp as IEntityExpression);
        }
        else {
            paramExp = new SqlParameterExpression(valueExp, colExp as IColumnMetaData);
        }
        this.paramExps.push(paramExp);
        return paramExp;
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
                this.parentRelation.relation = this.parentRelation.relation ? new AndExpression(this.parentRelation.relation, expression) : expression;
                return;
            }
        }

        this.where = this.where ? new AndExpression(this.where, expression) : expression;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): SelectExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const entity = resolveClone(this.entity, replaceMap);
        const clone = new SelectExpression(entity);
        replaceMap.set(this, clone);
        clone.itemExpression = resolveClone(this.itemExpression, replaceMap);
        clone.selects = this.selects.select((o) => resolveClone(o, replaceMap)).toArray();
        clone.orders = this.orders.select((o) => ({
            column: resolveClone(o.column, replaceMap),
            direction: o.direction
        })).toArray();

        clone.joins = this.joins.select((o) => {
            return o.clone(replaceMap);
        }).toArray();

        clone.includes = this.includes.select((o) => {
            return o.clone(replaceMap);
        }).toArray();

        clone.distinct = this.distinct;
        clone.where = resolveClone(this.where, replaceMap);
        clone.paramExps = this.paramExps.select((o) => replaceMap.has(o) ? replaceMap.get(o) as SqlParameterExpression : o).toArray();
        Object.assign(clone.paging, this.paging);
        return clone;
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes
            .union(this.joins.selectMany((o) => o.child.getEffectedEntities()))
            .union(this.includes.selectMany((o) => o.child.getEffectedEntities()))
            .distinct().toArray();
    }
    public getItemExpression(): IExpression {
        if (isColumnExp(this.itemExpression)) {
            return this.itemExpression;
        }
        return this.entity;
    }
    public hashCode() {
        let code: number = hashCode("SELECT", hashCode(this.entity.name, this.distinct ? 1 : 0));
        code = hashCodeAdd(code, this.selects.select((o) => o.hashCode()).sum());
        if (this.where) {
            code = hashCodeAdd(this.where.hashCode(), code);
        }
        code = hashCodeAdd(code, this.joins.sum((o) => o.child.hashCode()));
        code = hashCodeAdd(code, this.includes.sum((o) => o.child.hashCode()));
        return code;
    }
    public setOrder(orders: IOrderExpression[]): void;
    public setOrder(expression: IExpression<any>, direction: OrderDirection): void;
    public setOrder(expression: IExpression<any> | IOrderExpression[], direction?: OrderDirection) {
        if (!Array.isArray(expression)) {
            expression = [{
                column: expression,
                direction: direction
            }];
        }

        this.orders = expression;
    }
    public toString(): string {
        return `Select({
Entity:${this.entity.toString()},
Select:${this.selects.select((o) => o.toString()).toArray().join(",")},
Where:${this.where ? this.where.toString() : ""},
Join:${this.joins.select((o) => o.child.toString()).toArray().join(",")},
Include:${this.includes.select((o) => o.child.toString()).toArray().join(",")}
})`;
    }
    //#endregion
}
