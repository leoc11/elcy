import { SelectExpression } from "./SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { GroupByExpression } from "./GroupByExpression";
import { hashCode, resolveClone, visitExpression } from "../../Helper/Util";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { Enumerable } from "../../Enumerable/Enumerable";
import { JoinRelation } from "../Interface/JoinRelation";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";

export class GroupedExpression<T = any> extends SelectExpression<T> {
    public key: IExpression;
    public groupByExp: GroupByExpression<T>;

    private _groupBy: IColumnExpression<T>[];
    public get groupBy() {
        if (!this._groupBy) {
            this._groupBy = [];
            if ((this.key as any as IEntityExpression).primaryColumns) {
                const entityExp = this.key as any as IEntityExpression;
                const childSelectExp = entityExp.select;
                if (childSelectExp.parentRelation) {
                    const parentRel = childSelectExp.parentRelation;
                    if (parentRel.isEmbedded) {
                        const childSelects = childSelectExp.resolvedSelects.select(o => {
                            let curCol = this.entity.columns.first(c => c.columnName === o.columnName);
                            if (!curCol) {
                                curCol = o.clone();
                                curCol.entity = this.entity;
                            }
                            return curCol;
                        });
                        this._groupBy = childSelects.toArray();
                    }
                    else {
                        visitExpression(parentRel.relations, (exp: IExpression): boolean | void => {
                            if ((exp as IColumnExpression).entity && Enumerable.load(parentRel.parent.projectedColumns).contains(exp as any)) {
                                this._groupBy.add(exp as any);
                                return false;
                            }
                        });
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
    public get projectedColumns(): Iterable<IColumnExpression<T>> {
        return Enumerable.load(super.projectedColumns).union(this.groupBy);
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

            // this.parentRelation = select.parentRelation;
            for (const include of select.includes) {
                this.addInclude(include.name, include.child, include.relations, include.type);
            }
            for (const join of select.joins) {
                this.addJoin(join.child, join.relations, join.type);
            }

            this.isSubSelect = select.isSubSelect;
            this.parameters = select.parameters.slice();
        }
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
        Object.assign(clone.paging, this.paging);
        return clone;
    }
    public hashCode() {
        return hashCode("GROUPED", super.hashCode());
    }
}
