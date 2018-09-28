import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IQueryCommandExpression } from "./IQueryCommandExpression";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IObjectType, OrderDirection, JoinType } from "../../Common/Type";
import { hashCode, getClone } from "../../Helper/Util";
import { SelectExpression, IJoinRelation, IIncludeRelation } from "./SelectExpression";
import { IOrderExpression } from "./IOrderExpression";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IColumnExpression } from "./IColumnExpression";
export class SelectIntoExpression<T = any> implements IQueryCommandExpression<void> {
    public get type() {
        return undefined as any;
    }
    public get entity() {
        return this.select.entity;
    }
    public get parameters() {
        return this.select.parameters;
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
    public get joins() {
        return this.select.joins;
    }
    public get includes() {
        return [] as IIncludeRelation[];
    }
    public get distinct() {
        return this.select.distinct;
    }
    public get projectedColumns() {
        return this.select.projectedColumns;
    }
    constructor(public select: SelectExpression<T>) {
        this.select.includes = [];
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
    public clone(replaceMap?: Map<IExpression, IExpression>): SelectIntoExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const select = getClone(this.select, replaceMap);
        const clone = new SelectIntoExpression(select);
        replaceMap.set(this, clone);
        return clone;
    }
    public toQueryCommands(queryBuilder: QueryBuilder, parameters?: ISqlParameter[]): IQuery[] {
        queryBuilder.setParameters(parameters ? parameters : []);
        return queryBuilder.getSelectInsertQuery(this);
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
        return hashCode("INSERT", this.select.hashCode());
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
}
