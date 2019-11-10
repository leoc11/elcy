import { ColumnGeneration } from "../../Common/Enum";
import { JoinType, OrderDirection } from "../../Common/StringType";
import { IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveTreeClone } from "../../Helper/toObjectFunctionExpression";
import { hasFlags, hashCode, resolveClone } from "../../Helper/Util";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { JoinRelation } from "../Interface/JoinRelation";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IOrderExpression } from "./IOrderExpression";
import { QueryExpression } from "./QueryExpression";
import { SelectExpression } from "./SelectExpression";
export class UpdateExpression<T = any> extends QueryExpression<void> {
    public get entity() {
        return this.select.entity as EntityExpression<T>;
    }
    public get joins() {
        return this.select.joins;
    }
    public get orders() {
        return this.select.orders;
    }
    public get paging() {
        return this.select.paging;
    }
    public get type() {
        return undefined as any;
    }
    public get where() {
        return this.select.where;
    }
    public get generatedColumns() {
        if (!this._generatedColumns) {
            this._generatedColumns = this.returnGeneratedUpdate
                ? this.entity.columns.where((o) => hasFlags(o.columnMeta.generation, ColumnGeneration.Update)).toArray()
                : [];
        }
        return this._generatedColumns;
    }
    constructor(select: SelectExpression<T>,
                public readonly setter: { [K in keyof T]?: IExpression<T[K]> },
                public readonly returnGeneratedUpdate = false) {
        super();
        this.select = select;
        this.parameterTree = select.parameterTree;
        this.select.includes = [];
    }
    public select: SelectExpression<T>;

    public updateColumns: Array<IColumnExpression<T>>;
    private _generatedColumns: Array<IColumnExpression<T>>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMeta: IRelationMetaData<T, TChild>, toOneJoinType?: JoinType): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relations: Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type: JoinType): JoinRelation<T, any>;
    public addJoin<TChild>(child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<T, TChild> | Map<IColumnExpression<T, any>, IColumnExpression<TChild, any>>, type?: JoinType) {
        return this.select.addJoin(child, relationMetaOrRelations as any, type);
    }
    public addWhere(expression: IExpression<boolean>) {
        this.select.addWhere(expression);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): UpdateExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const select = resolveClone(this.select, replaceMap);
        const setter: { [key in keyof T]?: IExpression } = {};
        for (const prop in this.setter) {
            setter[prop] = resolveClone(this.setter[prop], replaceMap);
        }
        const clone = new UpdateExpression(select, setter);
        clone.parameterTree = resolveTreeClone(this.parameterTree, replaceMap);
        replaceMap.set(this, clone);
        return clone;
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
    public hashCode() {
        return hashCode("UPDATE", this.select.hashCode());
    }
    public setOrder(orders: IOrderExpression[]): void;
    public setOrder(expression: IExpression<any>, direction: OrderDirection): void;
    public setOrder(expression: IOrderExpression[] | IExpression<any>, direction?: OrderDirection) {
        this.select.setOrder(expression as any, direction);
    }
    public toString(): string {
        let setter = "";
        for (const prop in this.setter) {
            setter += `${prop}:${this.setter[prop].toString()},\n`;
        }
        return `Update(${this.entity.toString()}, {${setter}})`;
    }
}
