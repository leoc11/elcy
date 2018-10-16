import { SelectExpression, IJoinRelation, IIncludeRelation } from "./SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { GroupByExpression } from "./GroupByExpression";
import { IOrderExpression } from "./IOrderExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { JoinType } from "../../Common/Type";
import { resolveClone, hashCode } from "../../Helper/Util";
import { IColumnExpression } from "./IColumnExpression";

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
    public asIncludeResult: boolean;
    constructor(public readonly select: GroupByExpression<T>) {
        super(select.entity);
        this.joins = select.joins.slice(0);
        this.includes = [];
    }
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<T, TChild> | IExpression<boolean>, type?: JoinType) {
        if (!this.asIncludeResult) this.select.addJoinRelation(child, relationMetaOrRelations as any, type);
        return super.addJoinRelation(child, relationMetaOrRelations as any, type);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): GroupedExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const select = resolveClone(this.select, replaceMap);
        const clone = new GroupedExpression(select);
        replaceMap.set(this, clone);
        clone.itemExpression = resolveClone(this.itemExpression, replaceMap);
        clone.orders = this.orders.select(o => ({
            column: resolveClone(o.column, replaceMap),
            direction: o.direction
        })).toArray();
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
            child.parentRelation = rel;
            return rel;
        }).toArray();

        clone.includes = this.includes.select(o => {
            const cloneChild = resolveClone(o.child, replaceMap);
            const relation = resolveClone(o.relations, replaceMap);
            let map: Map<IColumnExpression, IColumnExpression>;
            if (o.relationMap) {
                for (const item of o.relationMap) {
                    const key = replaceMap.has(item[0]) ? replaceMap.get(item[0]) as any : item[0];
                    const value = replaceMap.has(item[1]) ? replaceMap.get(item[1]) as any : item[1];
                    map.set(key, value);
                }
            }

            const rel: IIncludeRelation = {
                child: cloneChild,
                parent: clone,
                relations: relation,
                relationMap: map,
                type: o.type,
                name: o.name,
                isFinish: o.isFinish
            };
            cloneChild.parentRelation = rel;
            return rel;
        }).toArray();

        clone.relationColumns = this.relationColumns.select(o => resolveClone(o, replaceMap)).toArray();
        clone.where = resolveClone(this.where, replaceMap);
        Object.assign(clone.paging, this.paging);
        return clone;
    }
    public addWhere(expression: IExpression<boolean>) {
        this.where = this.where ? new AndExpression(this.where, expression) : expression;
    }
    public hashCode() {
        return hashCode("GROUPED", super.hashCode());
    }
}
