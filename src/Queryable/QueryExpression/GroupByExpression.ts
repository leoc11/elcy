import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { SelectExpression, IIncludeRelation, IJoinRelation, } from "./SelectExpression";
import { Enumerable } from "../../Enumerable/Enumerable";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { resolveClone } from "../../Helper/Util";

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
        if (select.where) {
            this.where = select.where.clone();
        }
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
        const selectClone = resolveClone(this.selectori, replaceMap);
        const groupBy = this.groupBy.select(o => resolveClone(o, replaceMap)).toArray();
        const key = resolveClone(this.key, replaceMap);
        const hasItems = this.includes.any(o => o.name === "");
        const oriIncludes = selectClone.includes;
        const oriJoins = selectClone.joins;
        selectClone.joins = selectClone.includes = [];
        const clone = new GroupByExpression(selectClone, groupBy, key, hasItems);
        selectClone.includes = oriIncludes;
        selectClone.joins = oriJoins;

        replaceMap.set(this, clone);
        replaceMap.set(this.select, clone.select);
        clone.itemExpression = resolveClone(this.itemExpression, replaceMap);
        clone.selects = this.selects.select(o => resolveClone(o, replaceMap)).toArray();
        
        clone.joins = this.joins.select(o => {
            const child = resolveClone(o.child, replaceMap);
            const relation = resolveClone(o.relations, replaceMap);
            const rel: IJoinRelation = {
                child: child,
                parent: clone,
                relations: relation,
                type: o.type,
                isFinish: o.isFinish,
                name: o.name
            };
            if (child !== o.child) child.parentRelation = rel;
            return rel;
        }).toArray();

        clone.includes = this.includes.select(o => {
            let map: Map<IColumnExpression, IColumnExpression>;
            if (o.relationMap) {
                map = new Map();
                for (const item of o.relationMap) {
                    const key = replaceMap.has(item[0]) ? replaceMap.get(item[0]) as any : item[0];
                    const value = replaceMap.has(item[1]) ? replaceMap.get(item[1]) as any : item[1];
                    map.set(key, value);
                }
            }
            const cloneChild = resolveClone(o.child, replaceMap);
            const relation = resolveClone(o.relations, replaceMap);
            const rel: IIncludeRelation = {
                child: cloneChild,
                isFinish: o.isFinish,
                name: o.name,
                parent: clone,
                relations: relation,
                relationMap: map,
                type: o.type
            };
            if (cloneChild !== o.child) cloneChild.parentRelation = rel;
            return rel;
        }).toArray();
        
        if (this.where) clone.where = selectClone.where;
        if (this.having) clone.having = resolveClone(this.having, replaceMap);
        clone.relationColumns = this.relationColumns.select(o => resolveClone(o, replaceMap)).toArray();
        clone.select.relationColumns = this.select.relationColumns.select(o => resolveClone(o, replaceMap)).toArray();
        Object.assign(clone.paging, this.paging);
        return clone;
    }
}
