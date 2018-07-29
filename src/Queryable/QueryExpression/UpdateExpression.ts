import { OrderDirection, JoinType } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { ICommandQueryExpression } from "./ICommandQueryExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { NotExpression } from "../../ExpressionBuilder/Expression/NotExpression";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { RelationDataExpression } from "./RelationDataExpression";
import { IQueryCommand } from "../../QueryBuilder/Interface/IQueryCommand";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { IPagingExpression } from "./IPagingExpression";
import { SelectExpression, IJoinRelation } from "./SelectExpression";
import { clone } from "../../Helper/Util";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
export class UpdateExpression<T = any> implements ICommandQueryExpression<void> {
    public setter: { [key in keyof T]?: IExpression } = {};
    public entity: IEntityExpression;
    public paging: IPagingExpression = {};
    public where: IExpression<boolean>;
    public orders: IOrderExpression[] = [];
    public joins: IJoinRelation<T, any>[] = [];
    public get type() {
        return undefined as any;
    }
    constructor(entity: IEntityExpression<T>, setter: (() => { [key in keyof T]: any }) | { [key in keyof T]?: IExpression });
    constructor(select: SelectExpression<T>, setter: (() => { [key in keyof T]: any }) | { [key in keyof T]?: IExpression }); 
    constructor(selectOrEntity: IEntityExpression<T> | SelectExpression<T>, setter: (() => { [key in keyof T]: any }) | { [key in keyof T]?: IExpression }) {
        if (selectOrEntity instanceof SelectExpression) {
            this.entity = selectOrEntity.entity;
            this.paging = clone(selectOrEntity.paging);
            this.orders = selectOrEntity.orders.slice();
            if (selectOrEntity.where)
                this.where = selectOrEntity.where.clone();
        }
        else {
            this.entity = selectOrEntity;
            if (this.entity.deleteColumn)
                this.addWhere(new NotExpression(this.entity.deleteColumn));
        }

        if (setter instanceof Function) {
            const setterFn = ExpressionBuilder.parse(setter);
            setter = (setterFn.body as ObjectValueExpression<T>).object;
        }
        this.setter = setter;
    }
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
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relationMeta: IRelationMetaData<T, TChild>, toOneJoinType?: JoinType): IJoinRelation<T, any>;
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type: JoinType): IJoinRelation<T, any>;
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<T, TChild> | Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type?: JoinType) {
        let relationMap: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>;
        const existingRelation = this.joins.first((o) => o.child === child);
        if (existingRelation)
            return existingRelation;

        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                // include to relationSelect
                relationMap = new Map();
                let relMap = (relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                let relationSelect = new SelectExpression(new RelationDataExpression(relationMeta.relationData.type, relationMeta.relationData.name));
                for (const [relColMeta, parentColMeta] of relMap) {
                    const parentCol = this.entity.columns.first((o) => o.propertyName === parentColMeta.propertyName);
                    const relationCol = relationSelect.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    if (!relationCol.isPrimary) relationSelect.relationColumns.add(relationCol);
                    relationMap.set(parentCol, relationCol);
                }
                relationSelect.parentRelation = {
                    child: relationSelect,
                    parent: this as any,
                    relations: relationMap,
                    type: JoinType.LEFT
                };
                this.joins.push(relationSelect.parentRelation);

                relationMap.clear();
                // include child to relationSelect
                relMap = (!relationMeta.isMaster ? relationMeta.relationData.sourceRelationMaps : relationMeta.relationData.targetRelationMaps);
                for (const [relColMeta, childColMeta] of relMap) {
                    const relationCol = relationSelect.entity.columns.first((o) => o.propertyName === relColMeta.propertyName);
                    const childCol = child.entity.columns.first((o) => o.propertyName === childColMeta.propertyName);
                    if (!childCol.isPrimary) child.relationColumns.add(childCol);
                    relationMap.set(relationCol, childCol);
                }
                child.parentRelation = {
                    child,
                    parent: relationSelect,
                    relations: relationMap,
                    type: JoinType.INNER
                };
                relationSelect.joins.push(child.parentRelation);
                return child.parentRelation;
            }
            else {
                const relType = relationMeta.source.type === this.entity.type ? relationMeta.relationType : relationMeta.reverseRelation.relationType;
                type = relType === "one" ? type ? type : JoinType.INNER : JoinType.LEFT;
                relationMap = new Map();
                const isReverse = relationMeta.source.type !== this.entity.type;
                for (const [parentColMeta, childColMeta] of relationMeta.relationMaps) {
                    const parentCol = this.entity.columns.first((o) => o.propertyName === (isReverse ? childColMeta : parentColMeta).propertyName);
                    const childCol = child.entity.columns.first((o) => o.propertyName === (isReverse ? parentColMeta : childColMeta).propertyName);
                    if (!childCol.isPrimary) child.relationColumns.add(childCol);
                    relationMap.set(parentCol, childCol);
                }
            }
        }
        else {
            relationMap = relationMetaOrRelations as any;
            for (const [, childCol] of relationMap) {
                if (!childCol.isPrimary) child.relationColumns.add(childCol);
            }
        }

        child.parentRelation = {
            child: child,
            parent: this as any,
            relations: relationMap,
            type: type
        };
        this.joins.push(child.parentRelation);
        return child.parentRelation;
    }
    public clone(): UpdateExpression<T> {
        const clone = new UpdateExpression(this.entity.clone(), this.setter as any);
        clone.orders = this.orders.slice(0);

        for (const join of this.joins) {
            const child = join.child.clone();
            const relationMap = new Map();
            for (const [parentCol, childCol] of join.relations) {
                const cloneCol = clone.entity.columns.first(c => c.columnName === parentCol.columnName);
                const cloneChildCol = child.entity.columns.first(c => c.columnName === childCol.columnName);
                relationMap.set(cloneCol, cloneChildCol);
            }
            clone.addJoinRelation(child, relationMap, join.type);
        }
        if (this.where)
            clone.where = this.where.clone();
        Object.assign(clone.paging, this.paging);
        return clone;
    }
    public toQueryCommands(queryBuilder: QueryBuilder): IQueryCommand[] {
        return queryBuilder.getBulkUpdateQuery(this);
    }
    public execute() {
        return this as any;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return this.toQueryCommands(queryBuilder).select(o => o.query).toArray().join(";" + queryBuilder.newLine() + queryBuilder.newLine());
    }
}
