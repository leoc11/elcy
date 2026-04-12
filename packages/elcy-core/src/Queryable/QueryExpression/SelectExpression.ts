import { JoinType, OrderDirection, RelationshipType } from "../../Common/StringType";
import { ElementType, GenericType, IObjectType, ValueType } from "../../Common/Type";
import { Enumerable } from "@elcy/enumerable";
import { IEnumerable } from "@elcy/enumerable";
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
import { SqlTableValueParameterExpression, TSchema } from "./SqlTableValueParameterExpression";
import { ParameterExpression } from "src/ExpressionBuilder/Expression/ParameterExpression";

export class SelectExpression<TE extends object = any, T = unknown> implements IQueryExpression<T> {
    public get allColumns(): IEnumerable<IColumnExpression> {
        let columns = Enumerable.from(this.entity.columns).union(this.resolvedSelects);
        for (const join of this.joins) {
            const child = join.child;
            columns = columns.union(child.entity.columns).union(child.resolvedSelects);
        }
        for (const include of this.includes.filter((o) => o.isEmbedded)) {
            const child = include.child;
            columns = columns.union(child.entity.columns).union(child.resolvedSelects);
        }
        return columns;
    }
    /**
     * All select expressions used.
     */
    public get allSelects(): IEnumerable<SelectExpression> {
        return Enumerable.from<SelectExpression>([this]).union(Enumerable.from(this.joins).flatMap((o) => o.child.allSelects));
    }
    public get itemType(): GenericType<T> {
        return this.itemExpression.type;
    }
    public get primaryKeys(): IColumnExpression[] {
        return this.entity.primaryColumns;
    }
    public get projectedColumns(): IEnumerable<IColumnExpression> {
        if (this.isSelectOnly) {
            return this.selects;
        }

        if (this.distinct) {
            return Enumerable.from(this.relationColumns).union(this.resolvedSelects);
        }

        // primary column used in hydration to identify an entity.
        // relation column used in hydration to build relationship.
        let projectedColumns = Enumerable.from(this.primaryKeys).union(this.relationColumns);
        if (this.entity instanceof EntityExpression && this.entity.versionColumn && this.entity.metaData.concurrencyMode === "OPTIMISTIC VERSION") {
            // Version column for optimistic concurency.
            projectedColumns = projectedColumns.union([this.entity.versionColumn]);
        }
        projectedColumns = projectedColumns.union(this.resolvedSelects);

        return projectedColumns;
    }

    public get relationColumns(): IEnumerable<IColumnExpression> {
        // Include Relation Columns are used later for hydration
        let relations = Enumerable.from(this.includes).filter((o) => !o.isEmbedded).flatMap((o) => o.parentColumns);
        if (this.parentRelation) {
            // relation column might cames from child join columns
            relations = relations.union(this.parentRelation.childColumns);
        }
        return relations;
    }
    public get resolvedIncludes(): IEnumerable<IncludeRelation<TE>> {
        return Enumerable.from(this.includes).flatMap((o) => {
            if (o.isEmbedded) {
                return o.child.resolvedIncludes;
            }
            else {
                return [o];
            }
        });
    }
    public get resolvedJoins(): IEnumerable<JoinRelation<TE>> {
        let joins = Enumerable.from(this.joins);
        for (const include of Enumerable.from(this.includes).filter((o) => o.isEmbedded)) {
            joins = joins.union(include.child.resolvedJoins);
        }
        return joins;
    }
    public get resolvedSelects(): IEnumerable<IColumnExpression> {
        let selects = Enumerable.from<IColumnExpression>(this.selects);
        for (const include of this.includes) {
            if (include.isEmbedded) {
                const cloneMap = new Map();
                mapReplaceExp(cloneMap, include.child.entity, this.entity);
                // add column which include in embedded relation
                const childSelects = include.child.resolvedSelects.map((o) => {
                    let curCol = this.entity.columns.find((c) => c.propertyName === o.propertyName);
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
    public get resolvedOrders(): IEnumerable<IOrderExpression> {
        return Enumerable.from(this.parentRelation?.childColumns ?? []).map(o => ({
            column: o,
            direction: "ASC"
        } as IOrderExpression)).union(this.orders);
    }
    constructor(entity?: IEntityExpression<TE>, itemExp?: IExpression<T>) {
        if (entity) {
            this.entity = entity;
            if (!itemExp) {
                itemExp = entity as unknown as IExpression<T>;
            }
            this.itemExpression = itemExp;

            if (entity instanceof ProjectionEntityExpression) {
                this.selects = entity.columns.slice(0);
                this.paramExps = entity.paramExps.slice(0);
            }
            else {
                this.selects = entity.columns.filter((o) => o.columnMeta && o.columnMeta.isProjected);
            }
            entity.select = this;
        }
    }
    public distinct: boolean;

    //#region Properties
    private _entity: IEntityExpression<TE>;
    public get entity(): IEntityExpression<TE> {
        return this._entity;
    }
    public set entity(value: IEntityExpression<TE>) {
        this._entity = value;
    }
    private _includes: Array<IncludeRelation<TE>> = [];
    public get includes(): Array<IncludeRelation<TE>> {
        return this._includes;
    }
    public set includes(value: Array<IncludeRelation<TE>>) {
        this._includes = value;
    }
    // TODO: remove this workaround for insertInto Expression
    public isSelectOnly = false;
    private _isSubSelect: boolean;
    public get isSubSelect(): boolean {
        return this._isSubSelect;
    }
    public set isSubSelect(value: boolean) {
        this._isSubSelect = value;
    }
    private _itemExpression: IExpression<T>;
    public get itemExpression(): IExpression<T> {
        return this._itemExpression;
    }
    public set itemExpression(value: IExpression<T>) {
        this._itemExpression = value;
    }
    private _joins: Array<JoinRelation<TE>> = [];
    public get joins(): Array<JoinRelation<TE>> {
        return this._joins;
    }
    public set joins(value: Array<JoinRelation<TE>>) {
        this._joins = value;
    }
    private _orders: IOrderExpression[] = [];
    public get orders(): IOrderExpression[] {
        return this._orders;
    }
    public set orders(value: IOrderExpression[]) {
        this._orders = value;
    }
    private _paging: IPagingExpression = {};
    public get paging(): IPagingExpression {
        return this._paging;
    }
    public set paging(value: IPagingExpression) {
        this._paging = value;
    }
    private _paramExps: SqlParameterExpression[] = [];
    public get paramExps(): SqlParameterExpression[] {
        return this._paramExps;
    }
    public set paramExps(value: SqlParameterExpression[]) {
        this._paramExps = value;
    }

    private _parentRelation: ISelectRelation<any, TE>;
    public get parentRelation(): ISelectRelation<any, TE> {
        return this._parentRelation;
    }
    public set parentRelation(value: ISelectRelation<any, TE>) {
        this._parentRelation = value;
    }
    public selects: IColumnExpression[] = [];
    public type = Array;
    private _where: IExpression<boolean>;
    public get where(): IExpression<boolean> {
        return this._where;
    }
    public set where(value: IExpression<boolean>) {
        this._where = value;
    }
    public addInclude<TChild extends object>(name: string, child: SelectExpression<TChild>, relationMeta: IBaseRelationMetaData<TE, TChild>): IncludeRelation<TE, TChild>;
    public addInclude<TChild extends object>(name: string, child: SelectExpression<TChild>, relations: IExpression<boolean>, type: RelationshipType, isEmbedded?: boolean): IncludeRelation<TE, TChild>;
    public addInclude<TChild extends object>(name: string, child: SelectExpression<TChild>, relationMetaOrRelations: IBaseRelationMetaData<TE, TChild> | IExpression<boolean>, type?: RelationshipType, isEmbedded?: boolean): IncludeRelation<TE, TChild> {
        let relation: IExpression<boolean>;
        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                throw new Error("many-many relation not supported");
            }

            for (const [parentColMeta, childColMeta] of relationMeta.relationMaps) {
                const parentCol: IColumnExpression<TE, ValueType> = this.entity.columns.find((o) => o.propertyName === parentColMeta.propertyName);
                const childCol: IColumnExpression<TChild, ValueType> = child.entity.columns.find((o) => o.propertyName === childColMeta.propertyName);
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
            relation = relationMetaOrRelations as IExpression<boolean>;
        }

        const includeRel = new IncludeRelation(this, child, name, type, relation);
        includeRel.isEmbedded = isEmbedded;
        child.parentRelation = includeRel;
        this.includes.push(includeRel);
        return includeRel;
    }
    public addJoin<TChild extends object>(child: SelectExpression<TChild>, relationMeta: IBaseRelationMetaData<TE, TChild>, type?: JoinType): JoinRelation<TE, TChild>;
    public addJoin<TChild extends object>(child: SelectExpression<TChild>, relations: IExpression<boolean>, type: JoinType, isEmbedded?: boolean): JoinRelation<TE, TChild>;
    public addJoin<TChild extends object>(child: SelectExpression<TChild>, relationMetaOrRelations: IBaseRelationMetaData<TE, TChild> | IExpression<boolean>, type?: JoinType, isEmbedded?: boolean) {
        const existingRelation = this.joins.find((o) => o.child === child);
        if (existingRelation) {
            return existingRelation;
        }

        let relation: IExpression<boolean>;
        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                throw new Error("many-many relation not supported");
            }

            const isReverse = relationMeta.source.type !== this.entity.type;
            const relType = isReverse ? relationMeta.reverseRelation.relationType : relationMeta.relationType;
            for (const [parentColMeta, childColMeta] of relationMeta.relationMaps) {
                const parentCol: IColumnExpression<TE, ValueType> = this.entity.columns.find((o) => o.propertyName === (isReverse ? childColMeta : parentColMeta).propertyName);
                const childCol: IColumnExpression<TChild, ValueType> = child.entity.columns.find((o) => o.propertyName === (isReverse ? parentColMeta : childColMeta).propertyName);

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
            relation = relationMetaOrRelations as IExpression<boolean>;
        }

        const joinRel = new JoinRelation(this, child, relation, type);
        joinRel.isEmbedded = isEmbedded;
        child.parentRelation = joinRel;
        this.joins.push(joinRel);
        return joinRel;
    }
    public addSqlParameter<Tval extends object>(parameterExp: ParameterExpression<Tval[]>, parameterIndex: number, schema?: TSchema<Tval>): SqlTableValueParameterExpression<Tval>;
    public addSqlParameter<Tval>(valueExp: IExpression<Tval>, colExp?: IColumnMetaData): SqlParameterExpression<Tval>;
    public addSqlParameter<Tval>(valueExp: IExpression<Tval> | ParameterExpression<Array<ElementType<Tval> & object>>, colExpOrParamIndex?: IColumnMetaData | number, schema?: TSchema<Extract<Tval, object>>): SqlParameterExpression<Tval> | SqlTableValueParameterExpression<Extract<ElementType<Tval>, object>> {
        let paramExp: SqlParameterExpression<Tval>;
        if ((valueExp.type as GenericType<ElementType<Tval>[]>) === Array) {
            paramExp = new SqlTableValueParameterExpression(valueExp as ParameterExpression<Array<ElementType<Tval> & object>>, schema as any, colExpOrParamIndex as number) as unknown as SqlParameterExpression<Tval>;
        }
        else {
            paramExp = new SqlParameterExpression(valueExp as IExpression<Tval>, colExpOrParamIndex as IColumnMetaData<object, Tval>);
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
                if ((exp as IColumnExpression<TE>).entity) {
                    const colExp = exp as IColumnExpression<TE>;
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
    public clone(replaceMap?: Map<IExpression, IExpression>): SelectExpression<TE, T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const entity = resolveClone(this.entity, replaceMap);
        const itemExpression = resolveClone(this.itemExpression, replaceMap);
        const clone = new SelectExpression(entity, itemExpression);
        replaceMap.set(this, clone);
        clone.selects = this.selects.map((o) => resolveClone(o, replaceMap));
        clone.orders = this.orders.map((o) => ({
            column: resolveClone(o.column, replaceMap),
            direction: o.direction
        }));

        clone.joins = this.joins.map((o) => {
            return o.clone(replaceMap);
        });

        clone.includes = this.includes.map((o) => {
            return o.clone(replaceMap);
        });

        clone.distinct = this.distinct;
        clone.where = resolveClone(this.where, replaceMap);
        clone.paramExps = this.paramExps.map((o) => replaceMap.has(o) ? replaceMap.get(o) as SqlParameterExpression : o);
        Object.assign(clone.paging, this.paging);
        return clone;
    }
    public getEffectedEntities(): IObjectType[] {
        return Enumerable.from(this.entity.entityTypes)
            .union(this.joins.flatMap((o) => o.child.getEffectedEntities()))
            .union(this.includes.flatMap((o) => o.child.getEffectedEntities()))
            .distinct().toArray();
    }
    public getItemExpression(): IExpression {
        if (isColumnExp(this.itemExpression)) {
            return this.itemExpression;
        }
        return this.entity;
    }
    public hashCode() {
        let code: number = hashCode("MAP", hashCode(this.entity.name, this.distinct ? 1 : 0));
        code = hashCodeAdd(code, Enumerable.from(this.selects).map((o) => o.hashCode()).sum());
        if (this.where) {
            code = hashCodeAdd(this.where.hashCode(), code);
        }
        code = hashCodeAdd(code, Enumerable.from(this.joins).sum((o) => o.child.hashCode()));
        code = hashCodeAdd(code, Enumerable.from(this.includes).sum((o) => o.child.hashCode()));
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
Select:${this.selects.map((o) => o.toString()).join(",")},
Where:${this.where ? this.where.toString() : ""},
Join:${this.joins.map((o) => o.child.toString()).join(",")},
Include:${this.includes.map((o) => o.child.toString()).join(",")}
})`;
    }
    //#endregion
}
