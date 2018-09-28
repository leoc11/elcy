import { SelectExpression, IJoinRelation, IIncludeRelation } from "./SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { GroupByExpression } from "./GroupByExpression";
import { IOrderExpression } from "./IOrderExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { JoinType } from "../../Common/Type";
import { getClone } from "../../Helper/Util";

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
        const select = getClone(this.select, replaceMap);
        const clone = new GroupedExpression(select);
        clone.itemExpression = getClone(this.itemExpression, replaceMap);
        clone.orders = this.orders.select(o => ({
            column: getClone(o.column, replaceMap),
            direction: o.direction
        })).toArray();
        clone.selects = this.selects.select(o => getClone(o, replaceMap)).toArray();

        clone.joins = this.joins.select(o => {
            const child = getClone(o.child, replaceMap);
            const relation = getClone(o.relations, replaceMap);
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
            const cloneChild = getClone(o.child, replaceMap);
            const relation = getClone(o.relations, replaceMap);
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

        clone.where = getClone(this.where, replaceMap);
        Object.assign(clone.paging, this.paging);
        replaceMap.set(this, clone);
        return clone;
    }
    public addWhere(expression: IExpression<boolean>) {
        this.where = this.where ? new AndExpression(this.where, expression) : expression;
    }
}
