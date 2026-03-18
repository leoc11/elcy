import { RelationshipType } from "../../Common/StringType";
import { ValueType } from "../../Common/Type";
import { Enumerable, GroupedEnumerable } from "@elcy/enumerable";
import { IEnumerable } from "@elcy/enumerable";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode, hashCodeAdd, isColumnExp, isEntityExp, mapReplaceExp, resolveClone, visitExpression } from "../../Helper/Util";
import { IncludeRelation } from "../Interface/IncludeRelation";
import { JoinRelation } from "../Interface/JoinRelation";
import { ComputedColumnExpression } from "./ComputedColumnExpression";
import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { SelectExpression } from "./SelectExpression";

export class GroupByExpression<TE extends object = object, K = unknown, T = unknown> extends SelectExpression<TE, GroupedEnumerable<K, T>> {
    public get allColumns() {
        return this.groupBy.union(super.allColumns);
    }
    public get entity() {
        return this.itemSelect.entity;
    }
    public set entity(value) {
        if (this.itemSelect) {
            this.itemSelect.entity = value;
        }
    }
    public get groupBy() {
        return this.itemSelect.groupBy;
    }
    public get includes() {
        return this.itemSelect.includes;
    }
    public set includes(value) {
        if (this.itemSelect) {
            this.itemSelect.includes = value;
        }
    }
    public get isSubSelect() {
        return this.itemSelect.isSubSelect;
    }
    public set isSubSelect(value) {
        if (this.itemSelect) {
            this.itemSelect.isSubSelect = value;
        }
    }
    public get itemExpression() {
        return this.itemSelect.itemExpression;
    }
    public set itemExpression(value) {
        if (this.itemSelect) {
            this.itemSelect.itemExpression = value;
        }
    }
    public get joins() {
        return this.itemSelect.joins;
    }
    public set joins(value) {
        if (this.itemSelect) {
            this.itemSelect.joins = value;
        }
    }
    public get key() {
        return this.itemSelect.key;
    }
    public set key(value) {
        this.itemSelect.key = value;
    }
    public get orders() {
        return this.itemSelect.orders;
    }
    public set orders(value) {
        if (this.itemSelect) {
            this.itemSelect.orders = value;
        }
    }
    public get paging() {
        return this.itemSelect.paging;
    }
    public set paging(value) {
        if (this.itemSelect) {
            this.itemSelect.paging = value;
        }
    }
    public get paramExps() {
        return this.itemSelect.paramExps;
    }
    public set paramExps(value) {
        if (this.itemSelect) {
            this.itemSelect.paramExps = value;
        }
    }
    public get parentRelation() {
        return this.itemSelect.parentRelation;
    }
    public set parentRelation(value) {
        if (this.itemSelect) {
            this.itemSelect.parentRelation = value;
        }
    }
    public get primaryKeys() {
        return this.groupBy;
    }
    public get relationColumns() {
        return this.itemSelect.relationColumns;
    }
    public get projectedColumns(): IEnumerable<IColumnExpression<TE>> {
        if (this.isAggregate) {
            return this.relationColumns.union(this.resolvedSelects);
        }
        return this.itemSelect.projectedColumns;
    }
    public get resolvedGroupBy() {
        if (isEntityExp(this.key)) {
            const keyEntities = Array.from(this.key.select.allSelects.map((o) => o.entity));
            const groupBy = this.groupBy.slice();
            for (const column of Enumerable.from(this.selects).ofType(ComputedColumnExpression).filter((o) => !groupBy.some((g) => g.dataPropertyName === o.dataPropertyName))) {
                visitExpression(column.expression, (exp: IColumnExpression<any>) => {
                    if (isColumnExp(exp) && keyEntities.includes(exp.entity)) {
                        groupBy.push(exp);
                    }
                });
            }
            return groupBy;
        }
        return this.groupBy;
    }

    public get resolvedIncludes(): IEnumerable<IncludeRelation<TE>> {
        let includes = super.resolvedIncludes;
        if (!this.isAggregate && this.keyRelation) {
            if (this.keyRelation.isEmbedded) {
                includes = (this.keyRelation.child.resolvedIncludes as IEnumerable<IncludeRelation<TE>>).union(includes);
            }
            else {
                includes = ([this.keyRelation]).union(includes);
            }
        }
        return includes;
    }
    public get resolvedJoins(): IEnumerable<JoinRelation<TE>> {
        let join = super.resolvedJoins;
        if (this.keyRelation && this.keyRelation.isEmbedded && (!this.parentRelation || !this.parentRelation.isEmbedded)) {
            join = (this.keyRelation.child.resolvedJoins as IEnumerable<JoinRelation<TE>>).union(join);
        }
        return join;
    }
    public get resolvedSelects(): IEnumerable<IColumnExpression<any, ValueType>> {
        let selects = Enumerable.from(this.isAggregate ? this.selects : this.itemSelect.selects);
        for (const include of this.includes) {
            if (include.isEmbedded) {
                const cloneMap = new Map();
                mapReplaceExp(cloneMap, include.child.entity, this.entity);
                // add column which include in emdedded relation
                const childSelects = include.child.resolvedSelects.map((o: IColumnExpression<any, ValueType>) => {
                    let curCol = this.entity.columns.find((c) => c.propertyName === o.propertyName);
                    if (!curCol) {
                        curCol = o.clone(cloneMap);
                    }
                    return curCol;
                });
                // include.child.entity.alias = this.entity.alias;
                selects = selects.union(childSelects);
            }
        }
        super.resolvedSelects
        return selects;
    }
    public get where() {
        return this.itemSelect.where;
    }
    public set where(value) {
        if (this.itemSelect) {
            this.itemSelect.where = value;
        }
    }

    constructor(grouped: GroupedExpression<TE, K, T>);
    constructor(select: SelectExpression<TE, T>, key: IExpression);
    constructor(select: SelectExpression<TE, T> | GroupedExpression<TE, T>, key?: IExpression<K>) {
        super();
        if (select instanceof GroupedExpression) {
            this.itemSelect = select as GroupedExpression<TE, K, T>;
            this.itemSelect.groupByExp = this;
        }
        else {
            this.itemSelect = new GroupedExpression(select, key);
            this.itemSelect.groupByExp = this;
            this.entity.select = this;
            this.selects = this.groupBy.slice();
            for (const include of select.includes) {
                this.addInclude(include.name, include.child, include.relation, include.type);
            }
            for (const join of select.joins) {
                this.addJoin(join.child, join.relation, join.type);
            }

            const parentRel = select.parentRelation;
            if (parentRel) {
                parentRel.child = this;
                this.parentRelation = parentRel;
                select.parentRelation = null;
            }

            if (isEntityExp(key)) {
                // set key parent relation to this.
                const selectExp = key.select;
                const keyParentRel = selectExp.parentRelation;
                if (keyParentRel) {
                    const replaceMap = new Map();
                    for (const oriCol of keyParentRel.parentColumns) {
                        const col = this.projectedColumns.find(o => o.columnName === oriCol.columnName);
                        replaceMap.set(oriCol, col);
                    }
                    const relation = resolveClone(keyParentRel.relation, replaceMap);
                    this.addKeyRelation(selectExp, relation, "one");
                    this.keyRelation.isEmbedded = keyParentRel.isEmbedded;
                }
            }
        }
    }

    public having: IExpression<boolean>;
    public isAggregate: boolean;
    public readonly itemSelect: GroupedExpression<TE, K, T>;
    public keyRelation: IncludeRelation<TE, any>;
    public addKeyRelation<TChild extends object>(child: SelectExpression<TChild>, relation: IExpression<boolean>, type?: RelationshipType): IncludeRelation<TE, TChild> {
        const includeRel = new IncludeRelation(this, child, "key", type, relation);
        child.parentRelation = includeRel;
        this.keyRelation = includeRel;
        return includeRel;
    }
    public addWhere(expression: IExpression<boolean>) {
        this.having = this.having ? new AndExpression(this.having, expression) : expression;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): GroupByExpression<TE, K, T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const selectClone = resolveClone(this.itemSelect, replaceMap);
        const clone = new GroupByExpression(selectClone);
        replaceMap.set(this, clone);
        selectClone.groupByExp = clone;
        clone.having = resolveClone(this.having, replaceMap);
        clone.selects = this.selects.map((o) => resolveClone(o, replaceMap));
        clone.itemExpression = resolveClone(this.itemExpression, replaceMap);
        clone.isAggregate = this.isAggregate;
        return clone;
    }
    public getItemExpression() {
        if (this.isAggregate) {
            return this.itemSelect.getItemExpression();
        }
        return this.itemSelect;
    }
    public hashCode() {
        let code: number = super.hashCode();
        code = hashCodeAdd(hashCode("GROUPBY", code), Enumerable.from(this.groupBy).map((o) => o.hashCode()).sum());
        if (this.having) {
            code = hashCodeAdd(this.having.hashCode(), code);
        }
        return code;
    }
    public toString() {
        return `GroupBy({
Entity:${this.entity.toString()},
Select:${this.selects.map((o) => o.toString()).join(",")},
Where:${this.where ? this.where.toString() : ""},
Join:${this.joins.map((o) => o.child.toString()).join(",")},
Include:${this.includes.map((o) => o.child.toString()).join(",")},
Group:${this.groupBy.map((o) => o.toString()).join(",")},
Having:${this.having ? this.having.toString() : ""}
})`;
    }
}
