import { SelectExpression } from "./SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { GroupByExpression } from "./GroupByExpression";
import { hashCode, resolveClone, isEntityExp, mapReplaceExp } from "../../Helper/Util";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { JoinRelation } from "../Interface/JoinRelation";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { IBaseRelationMetaData } from "../../MetaData/Interface/IBaseRelationMetaData";
import { JoinType } from "../../Common/Type";
import { SqlParameterExpression } from "./SqlParameterExpression";
import { IEnumerable } from "../../Enumerable/IEnumerable";

export class GroupedExpression<T = any> extends SelectExpression<T> {
    public key: IExpression;
    public groupByExp: GroupByExpression<T>;

    private _groupBy: IColumnExpression<T>[];
    public get groupBy() {
        if (!this._groupBy) {
            this._groupBy = [];
            if (isEntityExp(this.key)) {
                const entityExp = this.key as IEntityExpression;
                const childSelectExp = entityExp.select;
                if (childSelectExp.parentRelation) {
                    const parentRel = childSelectExp.parentRelation;
                    if (parentRel.isEmbedded) {
                        const cloneMap = new Map();
                        mapReplaceExp(cloneMap, entityExp, this.entity);
                        const childSelects = childSelectExp.resolvedSelects.select(o => {
                            let curCol = this.entity.columns.first(c => c.propertyName === o.propertyName && c.constructor === o.constructor);
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
                for (const prop in this.key.object) {
                    this._groupBy.push(this.key.object[prop] as any);
                }
            }
            else {
                const column = this.key as any as IColumnExpression;
                this._groupBy.push(column);
            }
        }
        return this._groupBy;
    }
    public get allColumns() {
        return this.groupBy.union(super.allColumns);
    }
    public get projectedColumns(): IEnumerable<IColumnExpression<T>> {
        return super.projectedColumns.union(this.groupBy);
    }
    constructor();
    constructor(select: SelectExpression<T>, key: IExpression);
    constructor(select?: SelectExpression<T>, key?: IExpression) {
        super();
        if (select) {
            this.key = key;
            this.itemExpression = this.entity = select.entity;

            this.selects = select.selects.slice();
            this.distinct = select.distinct;
            // this.isAggregate = select.isAggregate;
            this.where = select.where;
            this.orders = select.orders.slice();
            Object.assign(this.paging, select.paging);

            this.isSubSelect = select.isSubSelect;
            this.paramExps = select.paramExps.slice();
        }
    }

    public addJoin<TChild>(child: SelectExpression<TChild>, relationMeta: IBaseRelationMetaData<T, TChild>, type?: JoinType, isEmbedded?: boolean): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relations: IExpression<boolean>, type: JoinType, isEmbedded?: boolean): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IBaseRelationMetaData<T, TChild> | IExpression<boolean>, type?: JoinType, isEmbedded?: boolean) {
        const joinRel = super.addJoin(child, relationMetaOrRelations as any, type, isEmbedded);
        joinRel.parent = this.groupByExp;
        return joinRel;
    }
    public toString() {
        return `Grouped({
Entity:${this.entity.toString()},
Select:${this.selects.select(o => o.toString()).toArray().join(",")},
Where:${this.where ? this.where.toString() : ""},
Join:${this.joins.select(o => o.child.toString()).toArray().join(",")},
Include:${this.includes.select(o => o.child.toString()).toArray().join(",")}
})`;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): GroupedExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const entity = resolveClone(this.entity, replaceMap);
        const clone = new GroupedExpression();
        replaceMap.set(this, clone);
        clone.entity = entity;
        if ((this.key as IEntityExpression).primaryColumns) {
            const entityExp = this.key as IEntityExpression;
            const relKeyClone = (entityExp.select.parentRelation as JoinRelation).clone(replaceMap);
            clone.key = relKeyClone.child.entity;
        }
        else {
            clone.key = resolveClone(this.key, replaceMap);
        }

        clone.itemExpression = resolveClone(this.itemExpression, replaceMap);
        clone.selects = this.selects.select(o => resolveClone(o, replaceMap)).toArray();
        clone.orders = this.orders.select(o => ({
            column: resolveClone(o.column, replaceMap),
            direction: o.direction
        })).toArray();

        clone.joins = this.joins.select(o => o.clone(replaceMap)).toArray();
        clone.includes = this.includes.select(o => o.clone(replaceMap)).toArray();

        clone.where = resolveClone(this.where, replaceMap);
        clone.paramExps = this.paramExps.select(o => replaceMap.has(o) ? replaceMap.get(o) as SqlParameterExpression : o).toArray();
        Object.assign(clone.paging, this.paging);
        return clone;
    }
    public hashCode() {
        return hashCode("GROUPED", super.hashCode());
    }
}
