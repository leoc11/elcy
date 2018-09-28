import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { SelectExpression, } from "./SelectExpression";
import { Enumerable } from "../../Enumerable/Enumerable";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { getClone } from "../../Helper/Util";

export class GroupByExpression<T = any> extends SelectExpression<T> {
    public having: IExpression<boolean>;
    public select: GroupedExpression<T, any>;
    public where: IExpression<boolean>;
    public readonly key: IExpression;
    public itemExpression: IExpression;
    protected selectori: SelectExpression<T>;
    constructor(select: SelectExpression<T>, public readonly groupBy: IColumnExpression<T>[], key: IExpression, hasItems?: boolean) {
        super(select.entity);
        // reset having added by parent constructor
        this.having = undefined;
        this.selects = [];
        if (select.parentRelation)
            select.parentRelation.child = this;
        if (select.where)
            this.where = select.where.clone();
        this.selectori = select;
        this.key = key;

        for (const join of select.joins) {
            const relation = join.relations;
            this.addJoinRelation(join.child, relation, join.type);
        }

        for (const include of select.includes) {
            this.addInclude(include.name, include.child, include.relations, include.type);
        }
        let groupExp: GroupedExpression;
        if (select instanceof GroupedExpression) {
            groupExp = new GroupedExpression(select.select);
        }
        else {
            groupExp = new GroupedExpression(this);
        }
        if (hasItems) {
            let relation: IExpression<boolean>;
            for (const col of groupBy) {
                // groupby column is primary.
                col.isPrimary = true;
                let clone = col.clone(new Map([[col.entity, col.entity]]));
                groupExp.relationColumns.add(clone);
                // remove current col if it's exist to avoid select same column.
                groupExp.selects.remove(col);
                const logicalExp = new StrictEqualExpression(col, clone);
                relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
            }
            this.addInclude("", groupExp, relation, "many");
        }
        this.select = groupExp;
        this.itemExpression = this.select;
    }
    public getVisitParam() {
        return this.itemExpression;
    }
    public get projectedColumns(): Enumerable<IColumnExpression<T>> {
        if (this.isAggregate)
            return this.selects.asEnumerable();
        return this.groupBy.union(this.relationColumns).union(this.selects);
    }
    public addWhere(expression: IExpression<boolean>) {
        this.having = this.having ? new AndExpression(this.having, expression) : expression;
    }
    public isSimple() {
        return false;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): GroupByExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const selectClone = getClone(this.selectori, replaceMap);
        const groupBy = this.groupBy.select(o => getClone(o, replaceMap)).toArray();
        const key = getClone(this.key, replaceMap);
        const hasItems = this.includes.any(o => o.name === "");
        const clone = new GroupByExpression(selectClone, groupBy, key, hasItems);
        replaceMap.set(this.select, clone.select);
        clone.itemExpression = getClone(this.itemExpression, replaceMap);
        clone.selects = this.selects.select(o => getClone(o, replaceMap)).toArray();
        if (this.having) clone.having = getClone(this.having, replaceMap);
        Object.assign(clone.paging, this.paging);
        replaceMap.set(this, clone);
        return clone;
    }
}
