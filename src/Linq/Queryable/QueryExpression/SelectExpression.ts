import { GenericType, OrderDirection, RelationType, JoinType } from "../../../Common/Type";
import { AndExpression, IExpression } from "../../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { ICommandQueryExpression } from "./ICommandQueryExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { IRelationMetaData } from "../../../MetaData/Interface/IRelationMetaData";
import { Enumerable } from "../../Enumerable/Enumerable";
import { ProjectionEntityExpression } from ".";
export interface IIncludeRelation<T = any, TChild = any> {
    child: SelectExpression<TChild>;
    parent: SelectExpression<T>;
    relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>;
    type: RelationType;
    name: string;
}
export interface IJoinRelation<T = any, TChild = any> {
    child: SelectExpression<TChild>;
    parent: SelectExpression<T>;
    relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>;
    type: JoinType;
}
export class SelectExpression<T = any> implements ICommandQueryExpression<T> {
    [prop: string]: any;
    public selects: IColumnExpression[] = [];
    private isSelectAll = true;
    public entity: IEntityExpression;
    public get type() {
        return Array;
    }
    public paging: { skip?: number, take?: number } = {};
    public where: IExpression<boolean>;
    public orders: IOrderExpression[] = [];
    public objectType: GenericType<any>;
    public includes: IIncludeRelation<T, any>[] = [];
    public joins: IJoinRelation<T, any>[] = [];
    public parentRelation: IJoinRelation<any, T> | IIncludeRelation<any, T>;
    public getVisitParam(): IExpression {
        return this.entity;
    }
    constructor(entity: IEntityExpression<T>) {
        this.entity = entity;
        this.objectType = entity.type;
        if (entity instanceof ProjectionEntityExpression) {
            this.selects = entity.selectedColumns.slice(0);
            this.relationColumns = entity.relationColumns.slice(0);
        }
        else
            this.selects = entity.columns.slice(0);
        this.isSelectAll = true;
        entity.select = this;
    }
    public get projectedColumns(): Enumerable<IColumnExpression<T>> {
        return this.entity.primaryColumns.union(this.relationColumns).union(this.selects);
    }
    public relationColumns: IColumnExpression[] = [];
    public addWhere(expression: IExpression<boolean>) {
        this.where = this.where ? new AndExpression(this.where, expression) : expression;
    }
    public addOrder(orders: IOrderExpression[]): void;
    public addOrder(expression: IExpression<any>, direction: OrderDirection): void;
    public addOrder(expression: IExpression<any> | IOrderExpression[], direction?: OrderDirection) {
        if (Array.isArray(expression)) {
            this.orders = this.orders.concat(expression);
        }
        else {
            this.orders.push({
                column: expression,
                direction: direction
            });
        }
    }
    public addInclude<TChild>(name: string, child: SelectExpression<TChild>, relationMeta: IRelationMetaData<T, TChild>): IIncludeRelation<T, TChild>;
    public addInclude<TChild>(name: string, child: SelectExpression<TChild>, relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type: RelationType): IIncludeRelation<T, TChild>;
    public addInclude<TChild>(name: string, child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<T, TChild> | Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type?: RelationType): IIncludeRelation<T, TChild> {
        let relationMap: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>;
        if ((relationMetaOrRelations as IRelationMetaData<T, TChild>).relationMaps) {
            const relationMeta = relationMetaOrRelations as IRelationMetaData<T, TChild>;
            relationMap = new Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>();
            for (const [parentProperty, childProperty] of relationMeta.relationMaps!) {
                const parentCol = this.entity.columns.first((o) => o.propertyName === parentProperty);
                const childCol = child.entity.columns.first((o) => o.propertyName === childProperty);
                if (!parentCol.isPrimary) this.relationColumns.add(parentCol);
                if (!childCol.isPrimary) child.relationColumns.add(childCol);
                relationMap.set(parentCol, childCol);
            }
            type = relationMeta.relationType;
        }
        else {
            relationMap = relationMetaOrRelations as any;
            for (const [parentCol, childCol] of relationMap) {
                if (!parentCol.isPrimary) this.relationColumns.add(parentCol);
                if (!childCol.isPrimary) child.relationColumns.add(childCol);
            }
        }
        child.parentRelation = {
            name,
            child,
            parent: this,
            relations: relationMap,
            type: type!
        };
        this.includes.push(child.parentRelation);
        return child.parentRelation;
    }

    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relationMeta: IRelationMetaData<T, TChild> | IRelationMetaData<TChild, T>): IJoinRelation<T, any>;
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type: JoinType): IJoinRelation<T, any>;
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<T, TChild> | IRelationMetaData<TChild, T> | Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type?: JoinType) {
        let relationMap: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>;
        const existingRelation = this.joins.first((o) => o.child.type === child.type);
        if (existingRelation)
            return existingRelation;

        if ((relationMetaOrRelations as IRelationMetaData<any, any>).relationMaps) {
            const relationMeta = relationMetaOrRelations as IRelationMetaData<any, any>;
            const relType = relationMeta.sourceType === this.entity.type ? relationMeta.relationType : RelationType.OneToOne;
            type = relType === RelationType.OneToOne ? JoinType.INNER : JoinType.LEFT;
            relationMap = new Map();
            const isReverse = relationMeta.sourceType !== this.entity.type;
            for (const [sourceProp, targetProp] of relationMeta.relationMaps) {
                const sourceCol = this.entity.columns.first((o) => o.propertyName === (isReverse ? targetProp : sourceProp));
                const targetCol = child.entity.columns.first((o) => o.propertyName === (isReverse ? sourceProp : targetProp));
                relationMap.set(sourceCol, targetCol);
            }
        }
        else {
            relationMap = relationMetaOrRelations as any;
        }

        child.parentRelation = {
            child: child,
            parent: this,
            relations: relationMap,
            type: type
        };
        this.joins.push(child.parentRelation);
        return child.parentRelation;
    }
    public clone(entity?: IEntityExpression): SelectExpression<T> {
        const clone = new SelectExpression(entity ? entity : this.entity.clone());
        clone.objectType = this.objectType;
        clone.selects = this.selects.select(o => {
            let col = clone.entity.columns.first(c => c.columnName === o.columnName);
            if (!col) {
                col = o.clone();
                col.entity = clone.entity;
            }
            return col;
        }).toArray();
        clone.isSelectAll = this.isSelectAll;
        return clone;
    }
    public execute(queryBuilder: QueryBuilder) {
        return this as any;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public clearDefaultColumns() {
        if (this.isSelectAll) {
            this.isSelectAll = false;
            for (const column of this.entity.columns)
                this.selects.remove(column);
        }
    }
    public isSimple() {
        return !this.where &&
            (this.paging.skip || 0) <= 0 && (this.paging.take || 0) <= 0 &&
            this.selects.length === this.entity.columns.length &&
            this.selects.all((c) => this.entity.columns.contains(c));
    }
}
