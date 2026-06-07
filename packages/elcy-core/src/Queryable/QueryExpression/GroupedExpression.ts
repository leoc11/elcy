import type { JoinType } from "../../Common/StringType";
import { Enumerable, type IEnumerable } from "@elcy/enumerable";
import type { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import type { IBaseRelationMetaData } from "../../MetaData/Interface/IBaseRelationMetaData";
import type { IColumnExpression } from "./IColumnExpression";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { isColumnExp, isEntityExp } from "../../Helper/Util";
import { mapReplaceExp } from "src/Helper/Expression";
import { resolveClone } from "src/Helper/Expression";
import { hashCode } from "../../Helper/Hash";
import { JoinRelation } from "../Interface/JoinRelation";
import { GroupByExpression } from "./GroupByExpression";
import { SelectExpression } from "./SelectExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";
import { IOrderExpression } from "./IOrderExpression";

export class GroupedExpression<TE extends object, K = unknown, T = TE> extends SelectExpression<TE, T> {
    public override get allColumns() {
        return Enumerable.from(this.groupBy).union(super.allColumns);
    }
    public override get resolvedOrders(): IEnumerable<IOrderExpression> {
        return Enumerable.from(this.parentRelation?.childColumns ?? []).concat(this.groupBy).map(o => ({
            column: o,
            direction: "ASC"
        } as IOrderExpression)).union(this.orders);
    }
    public get groupBy() {
        if (!this._groupBy) {
            this._groupBy = [];
            if (isEntityExp(this.key)) {
                const entityExp = this.key;
                const childSelectExp = entityExp.select;
                if (childSelectExp.parentRelation) {
                    const parentRel = childSelectExp.parentRelation;
                    if (parentRel.isEmbedded) {
                        const cloneMap = new Map();
                        mapReplaceExp(cloneMap, entityExp, this.entity);
                        const childSelects = Enumerable.from(childSelectExp.resolvedSelects).map((o) => {
                            let curCol = this.entity.columns.find((c) => c.propertyName === o.propertyName as string && c.constructor === o.constructor);
                            if (!curCol) {
                                curCol = o.clone(cloneMap);
                            }
                            return curCol;
                        });
                        this._groupBy = childSelects.toArray();
                    }
                    else {
                        this._groupBy = parentRel.parentColumns.slice();
                    }
                }
            }
            else if (this.key instanceof ObjectValueExpression) {
                for (const prop in (this.key as ObjectValueExpression<K & object>).object) {
                    this._groupBy.push(this.key.object[prop] as IColumnExpression);
                }
            }
            else if (isColumnExp(this.key)) {
                this._groupBy.push(this.key);
            }
            else {
                throw "unexpected";
            }
        }
        return this._groupBy;
    }
    public override get projectedColumns(): IEnumerable<IColumnExpression> {
        return Enumerable.from(super.projectedColumns).union(this.groupBy);
    }
    constructor();
    constructor(select: SelectExpression<TE, T>, key: IExpression<K>);
    constructor(select?: SelectExpression<TE, T>, key?: IExpression<K>) {
        super();
        if (select) {
            this.key = key;
            this.entity = select.entity;
            this.itemExpression = select.itemExpression;
            this.selects = select.selects.slice();
            this.distinct = select.distinct;
            this.isAggregated = select.isAggregated;
            this.where = select.where;
            this.orders = select.orders.slice();
            Object.assign(this.paging, select.paging);

            this.isSubSelect = select.isSubSelect;
            this.paramExps = select.paramExps.slice();
        }
    }
    public groupByExp: GroupByExpression<TE, K, T>;
    public key: IExpression<K>;

    private _groupBy: IColumnExpression[];

    public override addJoin<TChild extends object>(child: SelectExpression<TChild>, relationMeta: IBaseRelationMetaData<TE, TChild>, type?: JoinType): JoinRelation<TE, any>;
    public override addJoin<TChild extends object>(child: SelectExpression<TChild>, relations: IExpression<boolean>, type: JoinType, isEmbedded?: boolean): JoinRelation<TE, any>;
    public override addJoin<TChild extends object>(child: SelectExpression<TChild>, relationMetaOrRelations: IBaseRelationMetaData<TE, TChild> | IExpression<boolean>, type?: JoinType, isEmbedded?: boolean) {
        const joinRel = super.addJoin(child, relationMetaOrRelations as IExpression<boolean>, type, isEmbedded);
        joinRel.parent = this.groupByExp as any;
        return joinRel;
    }
    public override clone(replaceMap?: Map<IExpression, IExpression>): GroupedExpression<TE, K, T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const entity = resolveClone(this.entity, replaceMap);
        const clone = new GroupedExpression<TE, K, T>();
        replaceMap.set(this, clone);
        clone.entity = entity;
        if (isEntityExp(this.key)) {
            const entityExp = this.key;
            const relKeyClone = (entityExp.select.parentRelation as JoinRelation<any, K & object>).clone(replaceMap);
            clone.key = relKeyClone.child.entity;
        }
        else {
            clone.key = resolveClone(this.key, replaceMap);
        }

        clone.itemExpression = resolveClone(this.itemExpression, replaceMap);
        clone.selects = this.selects.map((o) => resolveClone(o, replaceMap));
        clone.orders = this.orders.map((o) => ({
            column: resolveClone(o.column, replaceMap),
            direction: o.direction
        }));

        clone.joins = this.joins.map((o) => o.clone(replaceMap));
        clone.includes = this.includes.map((o) => o.clone(replaceMap));

        clone.where = resolveClone(this.where, replaceMap);
        clone.paramExps = this.paramExps.map((o) => replaceMap.has(o) ? replaceMap.get(o) as SqlParameterExpression : o);
        Object.assign(clone.paging, this.paging);
        return clone;
    }
    public override hashCode() {
        return hashCode("GROUPED", super.hashCode());
    }
    public override toString() {
        return `Grouped({
Entity:${this.entity.toString()},
Select:${this.selects.map((o) => o.toString()).join(",")},
Where:${this.where ? this.where.toString() : ""},
Join:${this.joins.map((o) => o.child.toString()).join(",")},
Include:${this.includes.map((o) => o.child.toString()).join(",")}
})`;
    }
}
