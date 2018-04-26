import { SelectExpression } from "./SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { GroupByExpression, IJoinRelation, IIncludeRelation, IOrderExpression } from ".";
import { AndExpression } from "../../ExpressionBuilder/Expression";

export class GroupedExpression<T = any, TKey = any> extends SelectExpression<T> {
    public get where() {
        if (this.select)
            return this.select.where;
        return undefined;
    }
    public set where(value) {
        if (this.select)
            this.select.where = value;
    }
    public get orders(): IOrderExpression[] {
        if (this.select)
            return this.select.orders;
        return [];
    }
    public set orders(value) {
        if (this.select)
            this.select.orders = value;
    }
    public get key() {
        if (this.select)
            return this.select.key;
        return undefined;
    }
    constructor(public readonly select: GroupByExpression<T>) {
        super(select.entity);
    }
    public clone(): GroupedExpression<T> {
        const clone = new GroupedExpression(this.select.clone());
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
    public addWhere(expression: IExpression<boolean>) {
        this.where = this.where ? new AndExpression(this.where, expression) : expression;
    }
}
