import { OrderDirection, JoinType, IObjectType } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryCommandExpression } from "./IQueryCommandExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { SelectExpression, IJoinRelation } from "./SelectExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { hashCode, hashCodeAdd } from "../../Helper/Util";
export class UpdateExpression<T = any> implements IQueryCommandExpression<void> {
    public setter: { [key in keyof T]?: IExpression } = {};
    public select: SelectExpression<T>;
    public get parameters() {
        return this.select.parameters;
    }
    public get joins() {
        return this.select.joins;
    }
    public get type() {
        return undefined as any;
    }
    public get entity() {
        return this.select.entity;
    }
    public get paging() {
        return this.select.paging;
    }
    public get orders() {
        return this.select.orders;
    }
    public get where() {
        return this.select.where;
    }
    constructor(entity: IEntityExpression<T>, setter: (() => { [key in keyof T]: any }) | { [key in keyof T]?: IExpression });
    constructor(select: SelectExpression<T>, setter: (() => { [key in keyof T]: any }) | { [key in keyof T]?: IExpression });
    constructor(selectOrEntity: IEntityExpression<T> | SelectExpression<T>, setter: (() => { [key in keyof T]: any }) | { [key in keyof T]?: IExpression }) {
        if (selectOrEntity instanceof SelectExpression) {
            selectOrEntity = selectOrEntity.clone();
        } else {
            selectOrEntity = new SelectExpression(selectOrEntity);
        }
        this.select = selectOrEntity;
        this.select.includes = [];
        if (setter instanceof Function) {
            const setterFn = ExpressionBuilder.parse(setter);
            setter = (setterFn.body as ObjectValueExpression<T>).object;
        }
        this.setter = setter;
    }
    public addWhere(expression: IExpression<boolean>) {
        this.select.addWhere(expression);
    }
    public addOrder(orders: IOrderExpression[]): void;
    public addOrder(expression: IExpression<any>, direction: OrderDirection): void;
    public addOrder(expression: IOrderExpression[] | IExpression<any>, direction?: OrderDirection) {
        this.select.addOrder(expression as any, direction);
    }
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relationMeta: IRelationMetaData<T, TChild>, toOneJoinType?: JoinType): IJoinRelation<T, any>;
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type: JoinType): IJoinRelation<T, any>;
    public addJoinRelation<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<T, TChild> | Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type?: JoinType) {
        return this.select.addJoinRelation(child, relationMetaOrRelations as any, type);
    }
    public clone(findMap?: Map<IExpression, IExpression>): UpdateExpression<T> {
        const select = findMap.has(this.select) ? findMap.get(this.select) as SelectExpression : this.select.clone(findMap);
        const clone = new UpdateExpression(select, this.setter);
        return clone;
    }
    public toQueryCommands(queryBuilder: QueryBuilder, parameters?: ISqlParameter[]): IQuery[] {
        queryBuilder.setParameters(parameters);
        return queryBuilder.getBulkUpdateQuery(this);
    }
    public execute() {
        return this as any;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return this.toQueryCommands(queryBuilder).select(o => o.query).toArray().join(";" + queryBuilder.newLine() + queryBuilder.newLine());
    }
    public buildParameter(params: { [key: string]: any }): ISqlParameter[] {
        return this.select.buildParameter(params);
    }
    public hashCode() {
        let code = 0;
        for (const prop in this.setter) {
            code += hashCode(prop, hashCode(this.setter[prop].toString()));
        }
        return hashCode("UPDATE", hashCodeAdd(code, this.select.hashCode()));
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
}
