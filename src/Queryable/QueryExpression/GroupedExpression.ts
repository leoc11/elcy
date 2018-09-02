import { SelectExpression, IJoinRelation, IIncludeRelation } from "./SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { GroupByExpression } from "./GroupByExpression";
import { IOrderExpression } from "./IOrderExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IColumnExpression } from "./IColumnExpression";
import { JoinType } from "../../Common/Type";

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
        this.joins = select.joins.slice(0);
        this.includes = [];
    }
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<T, TChild> | IExpression<boolean>, type?: JoinType) {
        this.select.addJoinRelation(child, relationMetaOrRelations as any, type);
        return super.addJoinRelation(child, relationMetaOrRelations as any, type);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): GroupedExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const clone = new GroupedExpression(this.select.clone(replaceMap));
        clone.relationColumns = this.relationColumns.select(o => {
            let col = clone.entity.columns.first(c => c.columnName === o.columnName);
            if (!col) {
                col = replaceMap.has(o) ? replaceMap.get(o) as IColumnExpression : o.clone(replaceMap);
                col.entity = clone.entity;
            }
            return col;
        }).toArray();
        clone.itemExpression = this.itemExpression;
        clone.orders = this.orders.slice(0);
        clone.selects = this.selects.select(o => {
            let col = clone.entity.columns.first(c => c.columnName === o.columnName);
            if (!col) {
                col = replaceMap.has(o) ? replaceMap.get(o) as IColumnExpression : o.clone(replaceMap);
                col.entity = clone.entity;
            }
            return col;
        }).toArray();

        for (const parentCol of this.projectedColumns) {
            const cloneCol = clone.projectedColumns.first(c => c.columnName === parentCol.columnName);
            replaceMap.set(parentCol, cloneCol);
        }

        clone.joins = this.joins.select(o => {
            const child = replaceMap.has(o.child) ? replaceMap.get(o.child) as SelectExpression : o.child.clone(replaceMap);
            for (const parentCol of o.child.projectedColumns) {
                const cloneCol = child.projectedColumns.first(c => c.columnName === parentCol.columnName);
                replaceMap.set(parentCol, cloneCol);
            }
            const relation = o.relations.clone(replaceMap);
            const rel: IJoinRelation = {
                child: child,
                parent: clone,
                relations: relation,
                type: o.type
            };
            child.parentRelation = rel;
            return rel;
        }).toArray();

        clone.includes = this.includes.select(o => {
            const cloneChild = replaceMap.has(o.child) ? replaceMap.get(o.child) as SelectExpression : o.child.clone(replaceMap);
            for (const oriChildCol of o.child.projectedColumns) {
                const cloneChildCol = cloneChild.entity.columns.first(c => c.columnName === oriChildCol.columnName);
                replaceMap.set(oriChildCol, cloneChildCol);
            }
            const relation = o.relations.clone(replaceMap);
            const rel: IIncludeRelation = {
                child: cloneChild,
                parent: clone,
                name: o.name,
                relations: relation,
                type: o.type
            };
            cloneChild.parentRelation = rel;
            return rel;
        }).toArray();

        if (this.where)
            clone.where = this.where.clone(replaceMap);
        Object.assign(clone.paging, this.paging);
        return clone;
    }
    public addWhere(expression: IExpression<boolean>) {
        this.where = this.where ? new AndExpression(this.where, expression) : expression;
    }
}
