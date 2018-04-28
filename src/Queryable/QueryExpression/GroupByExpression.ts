import { IExpression, AndExpression, ObjectValueExpression } from "../../ExpressionBuilder/Expression";
import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { SelectExpression, } from "./SelectExpression";
import { Enumerable } from "../../Enumerable/Enumerable";
import { IEntityExpression, ComputedColumnExpression } from ".";

export class GroupByExpression<T = any> extends SelectExpression<T> {
    public having: IExpression<boolean>;
    public select: GroupedExpression<T, any>;
    public where: IExpression<boolean>;
    public readonly key: IExpression;
    public itemExpression: IExpression;
    protected selectori: SelectExpression<T>;
    constructor(select: SelectExpression<T>, public readonly groupBy: IColumnExpression[], key: IExpression, a?: boolean) {
        super(select.entity);
        this.selects = [];
        if (select.parentRelation)
            select.parentRelation.child = this;
        if (select.where)
            this.where = select.where.clone();
        this.selectori = select;
        this.key = key;
        for (const join of select.joins) {
            const child = join.child.clone();
            const relationMap = new Map();
            for (const [parentCol, childCol] of join.relations) {
                const cloneCol = this.entity.columns.first(c => c.columnName === parentCol.columnName);
                const childCloneCol = child.entity.columns.first(c => c.columnName === childCol.columnName);
                relationMap.set(cloneCol, childCloneCol);
            }
            this.addJoinRelation(child, relationMap, join.type);
        }
        for (const include of select.includes) {
            const child = include.child.clone();
            const relationMap = new Map();
            for (const [parentCol, childCol] of include.relations) {
                let cloneCol = this.entity.columns.first(c => c.columnName === parentCol.columnName);
                if (!cloneCol) {
                    const join = select.joins.first(o => o.child.entity.type === parentCol.entity.type);
                    cloneCol = join.child.entity.columns.first(c => c.columnName === parentCol.columnName);
                }
                const childCloneCol = child.entity.columns.first(c => c.columnName === childCol.columnName);
                relationMap.set(cloneCol, childCloneCol);
            }
            this.addInclude(include.name, child, relationMap, include.type);
        }
        let groupExp: GroupedExpression;
        if (select instanceof GroupedExpression) {
            groupExp = new GroupedExpression(select.select);
        }
        else {
            groupExp = new GroupedExpression(this);
        }
        if (a) {
            const itemRelMap = new Map();
            for (const col of groupBy) {
                itemRelMap.set(col, col);
            }
            this.addInclude("", groupExp, itemRelMap, "many");
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
    public clone(): GroupByExpression<T> {
        const selectClone = this.selectori.clone();
        const groupBy = this.groupBy.select(o => {
            if (o instanceof ComputedColumnExpression) {
                const comCol = o.clone();
                comCol.entity = selectClone.entity;
                return comCol;
            }
            let cloneCol = selectClone.entity.columns.first(c => c.columnName === o.columnName);
            if (!cloneCol) {
                const join = selectClone.joins.first(j => j.child.entity.type === o.entity.type);
                cloneCol = join.child.entity.columns.first(c => c.columnName === o.columnName);
            }
            cloneCol.propertyName = o.propertyName;
            return cloneCol;
        }).toArray();
        let key: IExpression;
        if ((this.key as IColumnExpression).entity) {
            key = groupBy.first(o => o.columnName === (this.key as IColumnExpression).columnName);
        }
        else if ((this.key as IEntityExpression).primaryColumns) {
            if (this.key === this.entity) {
                key = selectClone.entity;
            }
            else {
                key = selectClone.includes.first(o => o.name === "key").child.entity;
            }
        }
        else if (this.key instanceof ObjectValueExpression) {
            const obj: any = {};
            for (const prop in this.key.object) {
                const value = this.key.object[prop];
                if ((value as IEntityExpression).primaryColumns) {
                    if (value === this.entity) {
                        obj[prop] = selectClone.entity;
                    }
                    else {
                        obj[prop] = selectClone.includes.union(selectClone.joins as any[]).first(o => o.child.entity.type === (this.key as any).object[prop].type).child.entity;
                    }
                }
                else if ((value as IColumnExpression).entity) {
                    obj[prop] = groupBy.first(o => o.columnName === value.columnName);
                }
                else {
                    obj[prop] = value.clone();
                }
            }
            key = new ObjectValueExpression(obj);
        }
        const hasItems = this.includes.any(o => o.name === "");
        const clone = new GroupByExpression(selectClone, groupBy, key, hasItems);
        if (this.having)
            clone.having = this.having.clone();

        if (this.itemExpression !== this.select)
            clone.itemExpression = this.itemExpression;

        clone.selects = this.selects.select(o => {
            let col = clone.projectedColumns.first(c => c.columnName === o.columnName);
            if (!col) {
                col = o.clone();
                col.entity = clone.entity;
            }
            return col;
        }).toArray();
        Object.assign(clone.paging, this.paging);
        return clone;
    }
}
