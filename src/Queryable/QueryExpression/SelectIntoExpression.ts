import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IObjectType, OrderDirection, JoinType } from "../../Common/Type";
import { hashCode, resolveClone } from "../../Helper/Util";
import { SelectExpression } from "./SelectExpression";
import { IOrderExpression } from "./IOrderExpression";
import { EntityExpression } from "./EntityExpression";
import { JoinRelation } from "../Interface/JoinRelation";
import { Enumerable } from "../../Enumerable/Enumerable";
import { IBaseRelationMetaData } from "../../MetaData/Interface/IBaseRelationMetaData";
export class SelectIntoExpression<T = any> extends SelectExpression<T> {
    public get type() {
        return undefined as any;
    }
    public get parameters() {
        return this.select.parameters;
    }
    public get projectedColumns() {
        return Enumerable.from(this.select.projectedColumns).where(o => this.entity.metaData.columns.any(c => c.propertyName === o.propertyName));
    }
    constructor(public entity: EntityExpression<T>, public select: SelectExpression) { 
        super();
    }
    public addWhere(expression: IExpression<boolean>) {
        this.select.addWhere(expression);
    }
    public addOrder(orders: IOrderExpression[]): void;
    public addOrder(expression: IExpression<any>, direction: OrderDirection): void;
    public addOrder(expression: IOrderExpression[] | IExpression<any>, direction?: OrderDirection) {
        this.select.addOrder(expression as any, direction);
    }
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMeta: IBaseRelationMetaData<T, TChild>): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relations: IExpression<boolean>, type: JoinType, isEmbedded?: boolean): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IBaseRelationMetaData<T, TChild> | IExpression<boolean>, type?: JoinType, isEmbedded?: boolean) {
        return this.select.addJoin(child, relationMetaOrRelations as any, type, isEmbedded);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): SelectIntoExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const entity = resolveClone(this.entity, replaceMap);
        const select = resolveClone(this.select, replaceMap);
        const clone = new SelectIntoExpression(entity, select);
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
