import { OrderDirection, JoinType, IObjectType } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryCommandExpression } from "./IQueryCommandExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { SelectExpression } from "./SelectExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { EntityEntry } from "../../Data/EntityEntry";
import { columnMetaKey } from "../../Decorator/DecoratorKey";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { QueryVisitor } from "../../QueryBuilder/QueryVisitor";
import { SqlParameterExpression } from "../../ExpressionBuilder/Expression/SqlParameterExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { JoinRelation } from "../Interface/JoinRelation";
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
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMeta: IRelationMetaData<T, TChild>, toOneJoinType?: JoinType): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type: JoinType): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<T, TChild> | Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type?: JoinType) {
        return this.select.addJoin(child, relationMetaOrRelations as any, type);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): UpdateExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const select = resolveClone(this.select, replaceMap);
        const setter: { [key in keyof T]?: IExpression } = {};
        for (const prop in this.setter) {
            setter[prop] = resolveClone(this.setter[prop], replaceMap);
        }
        const clone = new UpdateExpression(select, setter);
        replaceMap.set(this, clone);
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
            code += hashCode(prop, this.setter[prop].hashCode());
        }
        return hashCode("UPDATE", hashCodeAdd(code, this.select.hashCode()));
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
}

export const updateItemExp = <T>(updateExp: UpdateExpression<T>, entry: EntityEntry<T>, visitor: QueryVisitor, queryParameters: ISqlParameter[]) => {
    const entityMeta = entry.metaData;
    const entity = entry.entity;
    const modifiedColumns = entry.getModifiedProperties().select(o => Reflect.getMetadata(columnMetaKey, entityMeta.type, o) as IColumnMetaData<T>).where(o => !!o);

    for (const o of modifiedColumns) {
        const paramName = visitor.newAlias("param");
        const paramExp = new SqlParameterExpression(paramName, new ParameterExpression(paramName, o.type), o);
        queryParameters.push({
            name: paramName,
            parameter: paramExp,
            value: entity[o.propertyName]
        });
        updateExp.setter[o.propertyName] = paramExp;
    }

    const modifiedColumn = entityMeta.modifiedDateColumn;
    if (modifiedColumn) {
        updateExp.setter[modifiedColumn.propertyName] = new MethodCallExpression(new ValueExpression(Date), "timestamp", [new ValueExpression(modifiedColumn.timeZoneHandling === "utc")]);
    }

    for (const colExp of updateExp.entity.primaryColumns) {
        const paramName = visitor.newAlias("param");
        const parameter = new SqlParameterExpression(paramName, new ParameterExpression(paramName, colExp.type), colExp.columnMetaData);
        const sqlParam = {
            name: paramName,
            parameter: parameter,
            value: entity[colExp.propertyName]
        };
        queryParameters.push(sqlParam);

        const compExp = new StrictEqualExpression(colExp, parameter);
        updateExp.addWhere(compExp);
    }

    switch (entityMeta.concurencyModel) {
        case "OPTIMISTIC VERSION": {
            let versionCol: IColumnMetaData<T> = entityMeta.versionColumn || entityMeta.modifiedDateColumn;
            if (!versionCol) throw new Error("Entity did not have version column");

            const paramName = visitor.newAlias("param");
            const parameter = new SqlParameterExpression(paramName, new ParameterExpression(paramName, versionCol.type), versionCol);
            const sqlParam = {
                name: paramName,
                parameter: parameter,
                value: entity[versionCol.propertyName]
            };
            queryParameters.push(sqlParam);

            const colExp = updateExp.entity.columns.first(c => c.propertyName === versionCol.propertyName);
            const compExp = new StrictEqualExpression(colExp, parameter);
            updateExp.addWhere(compExp);
            break;
        }
        case "OPTIMISTIC DIRTY": {
            for (const col of modifiedColumns) {
                const paramName = visitor.newAlias("param");
                const parameter = new SqlParameterExpression(paramName, new ParameterExpression(paramName, col.type), col);
                const sqlParam = {
                    name: paramName,
                    parameter: parameter,
                    value: entry.getOriginalValue(col.propertyName)
                };
                queryParameters.push(sqlParam);
                const colExp = updateExp.entity.columns.first(c => c.propertyName === col.propertyName);
                const compExp = new StrictEqualExpression(colExp, parameter);
                updateExp.addWhere(compExp);
            }
            break;
        }
    }
};