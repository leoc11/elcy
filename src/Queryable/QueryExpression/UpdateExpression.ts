import { OrderDirection, JoinType, IObjectType, FlatObjectLike } from "../../Common/Type";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryExpression } from "./IQueryExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { SelectExpression } from "./SelectExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { IQueryParameterMap } from "../../Query/IQueryParameter";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { EntityEntry } from "../../Data/EntityEntry";
import { columnMetaKey } from "../../Decorator/DecoratorKey";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { SqlParameterExpression } from "./SqlParameterExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { JoinRelation } from "../Interface/JoinRelation";
import { EntityExpression } from "./EntityExpression";
import { IQueryOption } from "../../Query/IQueryOption";
export class UpdateExpression<T = any> implements IQueryExpression<void> {
    public setter: { [key in keyof T]?: IExpression<T[key]> } = {};
    public select: SelectExpression<T>;
    public option: IQueryOption;
    public get paramExps() {
        return this.select.paramExps;
    }
    public set paramExps(value) {
        this.select.paramExps = value;
    }
    public get joins() {
        return this.select.joins;
    }
    public get type() {
        return undefined as any;
    }
    public get entity() {
        return this.select.entity as EntityExpression<T>;
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
    constructor(entity: IEntityExpression<T>, setter: (() => FlatObjectLike<T>) | { [key in keyof T]?: IExpression<T[key]> });
    constructor(select: SelectExpression<T>, setter: (() => FlatObjectLike<T>) | { [key in keyof T]?: IExpression<T[key]> });
    constructor(selectOrEntity: IEntityExpression<T> | SelectExpression<T>, setter: (() => FlatObjectLike<T>) | { [key in keyof T]?: IExpression<T[key]> }) {
        if (selectOrEntity instanceof SelectExpression) {
            selectOrEntity = selectOrEntity;
        } else {
            selectOrEntity = new SelectExpression(selectOrEntity);
        }
        this.select = selectOrEntity;
        this.select.includes = [];
        if (setter instanceof Function) {
            const setterFn = ExpressionBuilder.parse(setter);
            setter = (setterFn.body as ObjectValueExpression<FlatObjectLike<T>>).object;
        }
        this.setter = setter;
    }
    public addWhere(expression: IExpression<boolean>) {
        this.select.addWhere(expression);
    }
    public setOrder(orders: IOrderExpression[]): void;
    public setOrder(expression: IExpression<any>, direction: OrderDirection): void;
    public setOrder(expression: IOrderExpression[] | IExpression<any>, direction?: OrderDirection) {
        this.select.setOrder(expression as any, direction);
    }
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMeta: IRelationMetaData<T, TChild>, toOneJoinType?: JoinType): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type: JoinType): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<T, TChild> | Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type?: JoinType) {
        return this.select.addJoin(child, relationMetaOrRelations as any, type);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): UpdateExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const select = resolveClone(this.select, replaceMap);
        const setter: { [key in keyof T]?: IExpression<T[key]> } = {};
        for (const prop in this.setter) {
            setter[prop] = resolveClone(this.setter[prop], replaceMap);
        }
        const clone = new UpdateExpression(select, setter);
        replaceMap.set(this, clone);
        return clone;
    }
    public toString(): string {
        let setter = "";
        for (const prop in this.setter) {
            const val = this.setter[prop];
            setter += `${prop}:${val.toString()},\n`;
        }
        return `Update(${this.entity.toString()}, {${setter}})`;
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

export const updateItemExp = <T>(updateExp: UpdateExpression<T>, entry: EntityEntry<T>, queryParameters: IQueryParameterMap) => {
    const entityMeta = entry.metaData;
    const entity = entry.entity;
    const modifiedColumns = entry.getModifiedProperties().select(o => Reflect.getMetadata(columnMetaKey, entityMeta.type, o) as IColumnMetaData<T>).where(o => !!o);

    for (const o of modifiedColumns) {
        const paramExp = new SqlParameterExpression(new ParameterExpression("", o.type), o);
        queryParameters.set(paramExp, { value: entity[o.propertyName] });
        updateExp.setter[o.propertyName] = paramExp;
    }

    switch (entityMeta.concurrencyMode) {
        case "OPTIMISTIC VERSION": {
            let versionCol: IColumnMetaData<T> = entityMeta.versionColumn || entityMeta.modifiedDateColumn;
            if (!versionCol) throw new Error(`${entityMeta.name} did not have version column`);

            const parameter = new SqlParameterExpression(new ParameterExpression("", versionCol.type), versionCol);
            queryParameters.set(parameter, { value: entity[versionCol.propertyName] });
            updateExp.paramExps.push(parameter);

            const colExp = updateExp.entity.columns.first(c => c.propertyName === versionCol.propertyName);
            const compExp = new StrictEqualExpression(colExp, parameter);
            updateExp.addWhere(compExp);
            break;
        }
        case "OPTIMISTIC DIRTY": {
            for (const col of modifiedColumns) {
                const parameter = new SqlParameterExpression(new ParameterExpression("", col.type), col);
                queryParameters.set(parameter, { value: entry.getOriginalValue(col.propertyName) });
                updateExp.paramExps.push(parameter);
                const colExp = updateExp.entity.columns.first(c => c.propertyName === col.propertyName);
                const compExp = new StrictEqualExpression(colExp, parameter);
                updateExp.addWhere(compExp);
            }
            break;
        }
    }
    updateExp.paramExps = Array.from(queryParameters.keys());
};