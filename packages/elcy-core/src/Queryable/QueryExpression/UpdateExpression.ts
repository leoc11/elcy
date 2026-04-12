import { RelationMetaData } from "src/MetaData/Relation/RelationMetaData";
import { JoinType, OrderDirection } from "../../Common/StringType";
import { FlatObjectLike, IObjectType, SetterObj, StringKeyOf } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { JoinRelation } from "../Interface/JoinRelation";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IOrderExpression } from "./IOrderExpression";
import { IQueryExpression } from "./IQueryExpression";
import { IQueryIncludeRelation } from "./IQueryIncludeRelation";
import { SelectExpression } from "./SelectExpression";
import { StrictEqualExpression } from "src/ExpressionBuilder/Expression/StrictEqualExpression";
import { AndExpression } from "src/ExpressionBuilder/Expression/AndExpression";

export interface IUpdateIncludeRelation<TE extends object = any, TChild extends object = any> extends IQueryIncludeRelation<TE, TChild, UpdateExpression<TChild>, UpdateExpression<TE>> { }
export class UpdateExpression<TE extends object = object> implements IQueryExpression<TE> {
    public get entity() {
        return this.select.entity as EntityExpression<TE>;
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
    public get paramExps() {
        return this.select.paramExps;
    }
    public set paramExps(value) {
        this.select.paramExps = value;
    }
    public get type() {
        return undefined as IObjectType<void>;
    }
    public get where() {
        return this.select.where;
    }
    constructor(entity: EntityExpression<TE>, setter: (() => FlatObjectLike<TE>) | SetterObj<TE>, returnings?: Array<IColumnExpression<TE>>);
    constructor(select: SelectExpression<TE>, setter: (() => FlatObjectLike<TE>) | SetterObj<TE>, returnings?: Array<IColumnExpression<TE>>);
    constructor(selectOrEntity: EntityExpression<TE> | SelectExpression<TE>, setter: (() => FlatObjectLike<TE>) | SetterObj<TE>, returnings?: Array<IColumnExpression<TE>>) {
        if (selectOrEntity instanceof SelectExpression) {
            selectOrEntity = selectOrEntity;
        } else {
            selectOrEntity = new SelectExpression(selectOrEntity);
        }
        this.select = selectOrEntity;
        this.select.includes = [];
        
        if (setter instanceof Function) {
            const setterFn = ExpressionBuilder.parse(setter);
            this.setter = (setterFn.body as ObjectValueExpression<TE>).object;
        }
        else {
            this.setter = setter;
        }
        if (returnings) {
            this.returnings = returnings;
        }
        this.select.selects = [];
    }
    public returnings: Array<IColumnExpression<TE>> = [];
    public select: SelectExpression<TE>;
    public readonly setter: Readonly<SetterObj<TE>>;
    public addJoin<TChild extends object>(child: SelectExpression<TChild>, relationMeta: IRelationMetaData<TE, TChild>, toOneJoinType?: JoinType): JoinRelation<TE, TChild>;
    public addJoin<TChild extends object>(child: SelectExpression<TChild>, relations: IExpression<boolean>, type: JoinType): JoinRelation<TE, TChild>;
    public addJoin<TChild extends object>(child: SelectExpression<TChild>, relationMetaOrRelations: IRelationMetaData<TE, TChild> | IExpression<boolean>, type?: JoinType) {
        return this.select.addJoin(child, relationMetaOrRelations as IRelationMetaData<TE, TChild>, type);
    }
    public addWhere(expression: IExpression<boolean>) {
        this.select.addWhere(expression);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): UpdateExpression<TE> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const select = resolveClone(this.select, replaceMap);
        const setter: SetterObj<TE> = {};
        for (const prop in this.setter) {
            setter[prop as StringKeyOf<TE>] = resolveClone(this.setter[prop as StringKeyOf<TE>], replaceMap);
        }
        const clone = new UpdateExpression(select, setter);
        replaceMap.set(this, clone);
        return clone;
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
    public hashCode() {
        let code = 0;
        for (const prop in this.setter) {
            code += hashCode(prop, this.setter[prop as StringKeyOf<TE>].hashCode());
        }
        return hashCode("UPDATE", hashCodeAdd(code, this.select.hashCode()));
    }
    public setOrder(orders: IOrderExpression[]): void;
    public setOrder(expression: IExpression, direction: OrderDirection): void;
    public setOrder(expression: IOrderExpression[] | IExpression, direction?: OrderDirection) {
        this.select.setOrder(expression as IExpression, direction);
    }
    public toString(): string {
        let setter = "";
        for (const prop in this.setter) {
            const val = this.setter[prop as StringKeyOf<TE>];
            setter += `${prop}:${val.toString()},\n`;
        }
        return `Update(${this.entity.toString()}, {${setter}})`;
    }

    public includes: Array<IUpdateIncludeRelation<TE>> = [];
    public parentRelation: IUpdateIncludeRelation<any, TE>;
    public addInclude<TChild extends object>(child: UpdateExpression<TChild>, relationMeta: RelationMetaData<TE, TChild>): IUpdateIncludeRelation<TE, TChild>;
    public addInclude<TChild extends object>(child: UpdateExpression<TChild>, relations: IExpression<boolean>): IUpdateIncludeRelation<TE, TChild>;
    public addInclude<TChild extends object>(child: UpdateExpression<TChild>, relationMetaOrRelations: RelationMetaData<TE, TChild> | IExpression<boolean>): IUpdateIncludeRelation<TE, TChild> {
        let relations: IExpression<boolean>;
        if (relationMetaOrRelations instanceof RelationMetaData) {
            const relationMeta = relationMetaOrRelations;
            if (relationMeta.completeRelationType === "many-many") {
                throw new Error("many-many relation not supported");
            }

            relations = null;
            for (const [parentColMeta, childColMeta] of relationMeta.relationMaps) {
                const parentCol = this.entity.columns.find((o) => o.propertyName === parentColMeta.propertyName);
                const childCol = child.entity.columns.find((o) => o.propertyName === childColMeta.propertyName);
                const logicalExp = new StrictEqualExpression(parentCol, childCol);
                relations = relations ? new AndExpression(relations, logicalExp) : logicalExp;
            }
        }
        else {
            relations = relationMetaOrRelations;
        }
        const updateRelation: IUpdateIncludeRelation<TE, TChild> = {
            child: child,
            parent: this,
            relation: relations
        };
        child.parentRelation = updateRelation;
        this.includes.push(updateRelation);
        return updateRelation;
    }
}
