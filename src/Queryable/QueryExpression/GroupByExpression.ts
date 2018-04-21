import { IExpression, AndExpression } from "../../ExpressionBuilder/Expression";
import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { SelectExpression, IJoinRelation, IIncludeRelation } from "./SelectExpression";
import { Enumerable } from "../../Enumerable/Enumerable";

export class GroupByExpression<T = any> extends SelectExpression<T> {
    public having: IExpression<boolean>;
    public select: GroupedExpression<T, any>;
    public where: IExpression<boolean>;
    constructor(select: SelectExpression<T>, public readonly groupBy: IColumnExpression[], public readonly key: IExpression) {
        super(select.entity);
        let groupExp: GroupedExpression;
        if (select instanceof GroupedExpression) {
            groupExp = new GroupedExpression(select.select, select.key);
        }
        else {
            const selectExp = select.clone();
            selectExp.selects = this.groupBy.slice(0);
            groupExp = new GroupedExpression(selectExp, key);
        }
        this.select = groupExp;
        this.objectType = Array;
        this.selects = [];
        this.primaryColumns = this.select.selects.select(o => {
            const clone = o.clone();
            clone.isPrimary = true;
            return clone;
        }).toArray();
        this.includes = this.select.includes.slice(0);
        this.joins = this.select.joins.slice(0);
        this.parentRelation = select.parentRelation;
        if (this.select.where)
            this.where = this.select.where.clone();
        if (this.parentRelation)
            this.parentRelation.child = this;
    }
    public getVisitParam() {
        return this.select;
    }
    public primaryColumns: IColumnExpression<T>[];
    public get projectedColumns(): Enumerable<IColumnExpression<T>> {
        return this.primaryColumns.union(this.selects);
    }
    public addWhere(expression: IExpression<boolean>) {
        this.having = this.having ? new AndExpression(this.having, expression) : expression;
    }
    public clone(): GroupByExpression<T> {
        const clone = new GroupByExpression(this.select, this.groupBy, this.key);
        clone.objectType = this.objectType;
        clone.orders = this.orders.slice(0);
        clone.selects = this.selects.select(o => {
            let col = clone.entity.columns.first(c => c.columnName === o.columnName);
            if (!col) {
                col = o.clone();
                col.entity = clone.entity;
            }
            return col;
        }).toArray();

        clone.joins = this.joins.select(o => {
            const relationMap = new Map();
            for (const [parentCol, childCol] of o.relations) {
                const cloneCol = clone.entity.columns.first(c => c.columnName === parentCol.columnName);
                relationMap.set(cloneCol, childCol);
            }
            const child = o.child.clone();
            const rel: IJoinRelation = {
                child: child,
                parent: clone,
                relations: relationMap,
                type: o.type
            };
            child.parentRelation = rel;
            return rel;
        }).toArray();

        clone.includes = this.includes.select(o => {
            const relationMap = new Map();
            const child = o.child.clone();
            for (const [parentCol, childCol] of o.relations) {
                const cloneCol = clone.entity.columns.first(c => c.columnName === parentCol.columnName);
                const cloneChildCol = child.entity.columns.first(c => c.columnName === childCol.columnName);
                relationMap.set(cloneCol, cloneChildCol);
            }
            const rel: IIncludeRelation = {
                child: child,
                parent: clone,
                name: o.name,
                relations: relationMap,
                type: o.type
            };
            child.parentRelation = rel;
            return rel;
        }).toArray();

        if (this.where)
            clone.where = this.where.clone();
        Object.assign(clone.paging, this.paging);
        return clone;
    }
}
