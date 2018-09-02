import { GroupedExpression } from "./GroupedExpression";
import { IColumnExpression } from "./IColumnExpression";
import { SelectExpression, } from "./SelectExpression";
import { Enumerable } from "../../Enumerable/Enumerable";
import { IEntityExpression } from "./IEntityExpression";
import { ComputedColumnExpression } from "./ComputedColumnExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";

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
        if (select.where)
            this.where = select.where.clone();
        this.selectori = select;
        this.key = key;
        
        const replaceMap = new Map();
        for (const parentCol of select.projectedColumns) {
            const cloneCol = this.entity.columns.first(c => c.columnName === parentCol.columnName);
            replaceMap.set(parentCol, cloneCol);
        }
        for (const join of select.joins) {
            const child = join.child.clone();
            for (const childCol of join.child.projectedColumns) {
                const childCloneCol = child.entity.columns.first(c => c.columnName === childCol.columnName);
                replaceMap.set(childCol, childCloneCol);
            }
            const relation = join.relations.clone(replaceMap);
            this.addJoinRelation(child, relation, join.type);
        }

        for (const include of select.includes) {
            const child = include.child.clone();
            for (const childCol of include.child.projectedColumns) {
                const childCloneCol = child.entity.columns.first(c => c.columnName === childCol.columnName);
                replaceMap.set(childCol, childCloneCol);
            }
            const relation = include.relations.clone(replaceMap);
            this.addInclude(include.name, child, relation, include.type);
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
                const logicalExp = new StrictEqualExpression(col, col);
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
        const selectClone = replaceMap.has(this.selectori) ? replaceMap.get(this.selectori) as SelectExpression<T> : this.selectori.clone(replaceMap);
        const groupBy = this.groupBy.select(o => {
            if (o instanceof ComputedColumnExpression) {
                const comCol = replaceMap.has(o) ? replaceMap.get(o) as IColumnExpression<T> : o.clone();
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
                    obj[prop] = groupBy.first(o => o.columnName === (value as IColumnExpression).columnName);
                }
                else {
                    obj[prop] = replaceMap.has(value) ? replaceMap.get(value) : value.clone(replaceMap);
                }
            }
            key = new ObjectValueExpression(obj);
        }
        const hasItems = this.includes.any(o => o.name === "");
        const clone = new GroupByExpression(selectClone, groupBy, key, hasItems);
        if (this.having)
            clone.having = replaceMap.has(this.having) ? replaceMap.get(this.having) : this.having.clone(replaceMap);

        if (this.itemExpression !== this.select)
            clone.itemExpression = this.itemExpression;

        clone.selects = this.selects.select(o => {
            let col = clone.projectedColumns.first(c => c.columnName === o.columnName);
            if (!col) {
                col = replaceMap.has(o) ? replaceMap.get(o) as IColumnExpression : o.clone(replaceMap);
                col.entity = clone.entity;
            }
            return col;
        }).toArray();
        Object.assign(clone.paging, this.paging);
        return clone;
    }
}
