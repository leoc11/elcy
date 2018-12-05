import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { SelectExpression } from "./SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { resolveClone, hashCodeAdd, hashCode } from "../../Helper/Util";
import { IEntityExpression } from "./IEntityExpression";
import { Enumerable } from "../../Enumerable/Enumerable";
import { IncludeRelation } from "../Interface/IncludeRelation";
import { RelationshipType } from "../../Common/Type";

export class GroupByExpression<T = any> extends SelectExpression<T> {
    public get entity() {
        return this.itemSelect.entity;
    }
    public set entity(value) {
        if (this.itemExpression)
            this.itemSelect.entity = value;
    }
    public get where() {
        return this.itemSelect.where;
    }
    public set where(value) {
        if (this.itemExpression)
            this.itemSelect.where = value;
    }
    public get orders() {
        return this.itemSelect.orders;
    }
    public set orders(value) {
        if (this.itemExpression)
            this.itemSelect.orders = value;
    }
    public get relationColumns() {
        return this.itemSelect.relationColumns;
    }
    public get isSubSelect() {
        return this.itemSelect.isSubSelect;
    }
    public set isSubSelect(value) {
        if (this.itemExpression)
            this.itemSelect.isSubSelect = value;
    }
    public get parameters() {
        return this.itemSelect.parameters;
    }
    public set parameters(value) {
        if (this.itemExpression)
            this.itemSelect.parameters = value;
    }
    public get key() {
        return this.itemSelect.key;
    }
    public get groupBy() {
        return this.itemSelect.groupBy;
    }
    public set key(value) {
        this.itemSelect.key = value;
    }
    public isAggregate: boolean;
    private _selects: IColumnExpression<T>[] = [];
    public get selects() {
        if (this.isAggregate)
            return this._selects;
        return this.itemSelect.selects;
    }
    public set selects(value) {
        this._selects = value;
    }
    public get joins() {
        return this.itemSelect.joins;
    }
    public set joins(value) {
        if (this.itemExpression)
            this.itemSelect.joins = value;
    }
    public get includes() {
        return this.itemSelect.includes;
    }
    public set includes(value) {
        if (this.itemExpression)
            this.itemSelect.includes = value;
    }
    public having: IExpression<boolean>;
    public itemSelect: GroupedExpression<T>;
    public keyRelation: IncludeRelation<T>;
    constructor();
    constructor(select: SelectExpression<T>, key: IExpression);
    constructor(select?: SelectExpression<T>, key?: IExpression) {
        super();
        if (select) {
            this.itemExpression = this.itemSelect = new GroupedExpression(select, key);
            this.entity.select = this.itemSelect.groupByExp = this;
            this.selects = this.groupBy.slice();

            const parentRel = select.parentRelation;
            if (parentRel) {
                parentRel.child = this;
                this.parentRelation = parentRel;
                select.parentRelation = null;
            }

            if ((key as IEntityExpression).primaryColumns) {
                // set key parent relation to this.
                const entityExp = key as IEntityExpression;
                const selectExp = entityExp.select;
                const parentRel = selectExp.parentRelation;
                if (parentRel) {
                    this.addKeyRelation(selectExp, parentRel.relations, "one");
                    this.keyRelation.isEmbedded = parentRel.isEmbedded;
                }
            }
        }
    }
    public getVisitParam() {
        return this.itemExpression;
    }
    public get projectedColumns(): Iterable<IColumnExpression<T>> {
        if (this.isAggregate)
            return this._selects;
        return this.itemSelect.projectedColumns;
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
    public isSimple() {
        return false;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): GroupByExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const selectClone = resolveClone(this.itemSelect, replaceMap);
        const clone = new GroupByExpression();
        clone.itemSelect = selectClone;
        clone.having = resolveClone(this.having, replaceMap);
        clone.selects = this.selects.select(o => resolveClone(o, replaceMap)).toArray();
        return clone;
    }
    public hashCode() {
        let code: number = super.hashCode();
        code = hashCodeAdd(hashCode("GROUPBY", code), this.groupBy.select(o => o.hashCode()).sum());
        if (this.having) code = hashCodeAdd(this.where.hashCode(), code);
        return code;
    }

    public get resolvedIncludes(): Iterable<IncludeRelation<T>> {
        let includes = Enumerable.load(super.resolvedIncludes);
        if (!this.isAggregate && this.keyRelation && !this.keyRelation.isEmbedded) {
            includes = ([this.keyRelation]).union(includes);
        }
        return includes;
    }
}
