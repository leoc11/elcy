import { RelationshipType } from "../../Common/Type";
import { IEnumerable } from "../../Enumerable/IEnumerable";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { hashCode, hashCodeAdd, isColumnExp, isEntityExp, mapReplaceExp, resolveClone, visitExpression } from "../../Helper/Util";
import { IncludeRelation } from "../Interface/IncludeRelation";
import { JoinRelation } from "../Interface/JoinRelation";
import { ComputedColumnExpression } from "./ComputedColumnExpression";
import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { SelectExpression } from "./SelectExpression";

export class GroupByExpression<T = any> extends SelectExpression<T> {
    public get entity() {
        return this.itemSelect.entity;
    }
    public set entity(value) {
        if (this.itemSelect) {
            this.itemSelect.entity = value;
        }
    }
    public get where() {
        return this.itemSelect.where;
    }
    public set where(value) {
        if (this.itemSelect) {
            this.itemSelect.where = value;
        }
    }
    public get orders() {
        return this.itemSelect.orders;
    }
    public set orders(value) {
        if (this.itemSelect) {
            this.itemSelect.orders = value;
        }
    }
    public get relationColumns() {
        return this.itemSelect.relationColumns;
    }
    public get isSubSelect() {
        return this.itemSelect.isSubSelect;
    }
    public set isSubSelect(value) {
        if (this.itemSelect) {
            this.itemSelect.isSubSelect = value;
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
    public get key() {
        return this.itemSelect.key;
    }
    public set key(value) {
        this.itemSelect.key = value;
    }
    public get groupBy() {
        return this.itemSelect.groupBy;
    }
    public isAggregate: boolean;
    public get joins() {
        return this.itemSelect.joins;
    }
    public set joins(value) {
        if (this.itemSelect) {
            this.itemSelect.joins = value;
        }
    }
    public get includes() {
        return this.itemSelect.includes;
    }
    public set includes(value) {
        if (this.itemSelect) {
            this.itemSelect.includes = value;
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
    public get paging() {
        return this.itemSelect.paging;
    }
    public set paging(value) {
        if (this.itemSelect) {
            this.itemSelect.paging = value;
        }
    }
    public get resolvedGroupBy() {
        if (isEntityExp(this.key)) {
            const keyEntities = Array.from(this.key.select.allSelects.select((o) => o.entity));
            const groupBy = this.groupBy.slice();
            for (const column of this.selects.ofType(ComputedColumnExpression).where((o) => !groupBy.any((g) => g.dataPropertyName === o.dataPropertyName))) {
                visitExpression(column.expression, (exp: IColumnExpression<any>) => {
                    if (isColumnExp(exp) && keyEntities.contains(exp.entity)) {
                        groupBy.push(exp);
                    }
                });
            }
            return groupBy;
        }
        return this.groupBy;
    }
    public get resolvedSelects(): IEnumerable<IColumnExpression> {
        let selects = this.isAggregate ? this.selects.asEnumerable() : this.itemSelect.selects.asEnumerable();
        for (const include of this.includes) {
            if (include.isEmbedded) {
                const cloneMap = new Map();
                mapReplaceExp(cloneMap, include.child.entity, this.entity);
                // add column which include in emdedded relation
                const childSelects = include.child.resolvedSelects.select((o) => {
                    let curCol = this.entity.columns.first((c) => c.propertyName === o.propertyName);
                    if (!curCol) { curCol = o.clone(cloneMap); }
                    return curCol;
                });
                // include.child.entity.alias = this.entity.alias;
                selects = selects.union(childSelects);
            }
        }
        return selects;
    }
    public get itemExpression() {
        return this.itemSelect.itemExpression;
    }
    public set itemExpression(value) {
        if (this.itemSelect) {
            this.itemSelect.itemExpression = value;
        }
    }
    public having: IExpression<boolean>;
    public itemSelect: GroupedExpression<T>;
    public keyRelation: IncludeRelation<T>;
    constructor();
    constructor(select: SelectExpression<T>, key: IExpression);
    constructor(select?: SelectExpression<T>, key?: IExpression) {
        super();
        if (select) {
            this.itemSelect = new GroupedExpression(select, key);
            this.entity.select = this.itemSelect.groupByExp = this;
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
                    let relation: IExpression<boolean>;
                    for (const col of this.groupBy) {
                        const childCol = selectExp.projectedColumns.first((o) => o.propertyName === col.propertyName);
                        const logicalExp = new StrictEqualExpression(col, childCol);
                        relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                    }
                    this.addKeyRelation(selectExp, relation, "one");
                    this.keyRelation.isEmbedded = keyParentRel.isEmbedded;
                }
            }
        }
    }
    public getItemExpression() {
        if (this.isAggregate) {
            return this.itemSelect.getItemExpression();
        }
        return this.itemSelect;
    }
    public get allColumns() {
        return this.groupBy.union(super.allColumns);
    }
    public get projectedColumns(): IEnumerable<IColumnExpression<T>> {
        if (this.isAggregate) {
            return this.relationColumns.union(this.resolvedSelects);
        }
        return this.itemSelect.projectedColumns;
    }
    public get primaryKeys() {
        return this.groupBy;
    }
    public addWhere(expression: IExpression<boolean>) {
        this.having = this.having ? new AndExpression(this.having, expression) : expression;
    }
    public addKeyRelation<TChild>(child: SelectExpression<TChild>, relation: IExpression<boolean>, type?: RelationshipType): IncludeRelation<T, TChild> {
        const includeRel = new IncludeRelation(this, child, "key", type, relation);
        child.parentRelation = includeRel;
        this.keyRelation = includeRel;
        return includeRel;
    }
    public toString() {
        return `GroupBy({
Entity:${this.entity.toString()},
Select:${this.selects.select((o) => o.toString()).toArray().join(",")},
Where:${this.where ? this.where.toString() : ""},
Join:${this.joins.select((o) => o.child.toString()).toArray().join(",")},
Include:${this.includes.select((o) => o.child.toString()).toArray().join(",")},
Group:${this.groupBy.select((o) => o.toString()).toArray().join(",")},
Having:${this.having ? this.having.toString() : ""}
})`;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): GroupByExpression<T> {
        if (!replaceMap) { replaceMap = new Map(); }
        const selectClone = resolveClone(this.itemSelect, replaceMap);
        const clone = new GroupByExpression();
        replaceMap.set(this, clone);
        clone.itemSelect = selectClone;
        selectClone.groupByExp = clone;
        clone.having = resolveClone(this.having, replaceMap);
        clone.selects = this.selects.select((o) => resolveClone(o, replaceMap)).toArray();
        clone.itemExpression = resolveClone(this.itemExpression, replaceMap);
        clone.isAggregate = this.isAggregate;
        return clone;
    }
    public hashCode() {
        let code: number = super.hashCode();
        code = hashCodeAdd(hashCode("GROUPBY", code), this.groupBy.select((o) => o.hashCode()).sum());
        if (this.having) { code = hashCodeAdd(this.having.hashCode(), code); }
        return code;
    }

    public get resolvedIncludes(): IEnumerable<IncludeRelation<T>> {
        let includes = super.resolvedIncludes;
        if (!this.isAggregate && this.keyRelation) {
            if (this.keyRelation.isEmbedded) {
                includes = this.keyRelation.child.resolvedIncludes.union(includes);
            }
            else {
                includes = ([this.keyRelation]).union(includes);
            }
        }
        return includes;
    }
    public get resolvedJoins(): IEnumerable<JoinRelation<T>> {
        let join = super.resolvedJoins;
        if (this.keyRelation && this.keyRelation.isEmbedded && (!this.parentRelation || !this.parentRelation.isEmbedded)) {
            join = this.keyRelation.child.resolvedJoins.union(join);
        }
        return join;
    }
}
