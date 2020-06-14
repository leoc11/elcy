import { INodeTree, ParameterStack } from "../Common/ParameterStack";
import { DeleteMode } from "../Common/StringType";
import { GenericType, IObjectType, ObjectLike, PredicateSelector, ResultSelector, ValueType } from "../Common/Type";
import { DbContext } from "../Data/DbContext";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { AndExpression } from "../ExpressionBuilder/Expression/AndExpression";
import { EqualExpression } from "../ExpressionBuilder/Expression/EqualExpression";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../ExpressionBuilder/Expression/StrictEqualExpression";
import { isNull, isValue } from "../Helper/Util";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { AllDeferredQuery } from "../Query/DeferredQuery/AllDeferredQuery";
import { AnyDeferredQuery } from "../Query/DeferredQuery/AnyDeferredQuery";
import { AvgDeferredQuery } from "../Query/DeferredQuery/AvgDeferredQuery";
import { BulkDeleteDeferredQuery } from "../Query/DeferredQuery/BulkDeleteDeferredQuery";
import { BulkUpdateDeferredQuery } from "../Query/DeferredQuery/BulkUpdateDeferredQuery";
import { CountDeferredQuery } from "../Query/DeferredQuery/CountDeferredQuery";
import { DeferredQuery } from "../Query/DeferredQuery/DeferredQuery";
import { FirstDeferredQuery } from "../Query/DeferredQuery/FirstDeferredQuery";
import { InsertIntoDeferredQuery } from "../Query/DeferredQuery/InsertIntoDeferredQuery";
import { MaxDeferredQuery } from "../Query/DeferredQuery/MaxDeferredQuery";
import { MinDeferredQuery } from "../Query/DeferredQuery/MinDeferredQuery";
import { SumDeferredQuery } from "../Query/DeferredQuery/SumDeferredQuery";
import { ToArrayDeferredQuery } from "../Query/DeferredQuery/ToArrayDeferredQuery";
import { ToMapDeferredQuery } from "../Query/DeferredQuery/ToMapDeferredQuery";
import { IQueryOption } from "../Query/IQueryOption";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { QueryExpression } from "./QueryExpression/QueryExpression";

export abstract class Queryable<T = any> {
    public get dbContext(): DbContext {
        return this.parent.dbContext;
    }
    /**
     * parameter that is actually used by current queryable
     */
    public get stackTree(): INodeTree<ParameterStack> {
        if (!this._parameters) {
            this._parameters = this.parent.stackTree;
        }
        return this._parameters;
    }
    public get queryOption(): IQueryOption {
        return this.parent ? this.parent.queryOption : {};
    }
    constructor(public type: GenericType<T>, parent?: Queryable) {
        if (parent) {
            this.parent = parent;
        }
    }
    protected parent: Queryable;
    private _parameters: INodeTree<ParameterStack>;
    public async all(predicate: PredicateSelector<T>) {
        const query = this.deferredAll(predicate);
        return await query.execute();
    }
    public async any(predicate?: PredicateSelector<T>) {
        const query = this.deferredAny(predicate);
        return await query.execute();
    }
    public async avg(selector?: (item: T) => number) {
        const query = this.deferredAvg(selector);
        return await query.execute();
    }

    //#region Get Result
    public abstract buildQuery(queryVisitor: IQueryVisitor): QueryExpression<T[]>;
    public async contains(item: T) {
        const query = this.deferredContains(item);
        return await query.execute();
    }
    public async count() {
        const query = this.deferredCount();
        return await query.execute();
    }
    public deferredAll(predicate: PredicateSelector<T>) {
        return new AllDeferredQuery(this, predicate);
    }
    public deferredAny(predicate?: PredicateSelector<T>) {
        const query = predicate ? this.where(predicate) : this;
        return new AnyDeferredQuery(query);
    }
    public deferredAvg(selector?: (item: T) => number) {
        const query: Queryable<number> = selector ? this.select(selector) : this as any as Queryable<number>;
        return new AvgDeferredQuery(query);
    }
    public deferredContains(item: T) {
        const paramExp = new ParameterExpression("o", this.type);
        const itemParamExp = new ParameterExpression("item", item.constructor as any);
        let bodyExp: IExpression<boolean>;
        if (isValue(item)) {
            bodyExp = new StrictEqualExpression(paramExp, itemParamExp);
        }
        else {
            const entityMeta = Reflect.getOwnMetadata(entityMetaKey, this.type) as IEntityMetaData<T>;
            if (entityMeta) {
                for (const pk of entityMeta.primaryKeys) {
                    const d = new StrictEqualExpression(new MemberAccessExpression(paramExp, pk.propertyName), new MemberAccessExpression(itemParamExp, pk.propertyName));
                    bodyExp = bodyExp ? new AndExpression(bodyExp, d) : d;
                }
            }
            else {
                // TODO: compare all property for type. not from item
                for (const prop in item) {
                    if (isValue(item[prop]) || isNull(item[prop])) {
                        const d = new StrictEqualExpression(new MemberAccessExpression(paramExp, prop), new MemberAccessExpression(itemParamExp, prop));
                        bodyExp = bodyExp ? new AndExpression(bodyExp, d) : d;
                    }
                }
            }
        }
        const predicate = new FunctionExpression(bodyExp, [paramExp]);
        return this.parameter({ item: item }).where(predicate as any).deferredAny();
    }
    public deferredCount() {
        return new CountDeferredQuery(this);
    }
    public deferredFind(id: ValueType | ObjectLike<T>) {
        const isValueType = isValue(id);
        const dbSet = this.dbContext.set(this.type as IObjectType<T>);
        if (!dbSet) {
            throw new Error("Find only support entity queryable");
        }

        const param = new ParameterExpression("o", this.type);
        const paramId = new ParameterExpression("id", id.constructor as any);
        let andExp: IExpression<boolean>;
        if (isValueType) {
            andExp = new EqualExpression(new MemberAccessExpression(param, dbSet.primaryKeys.first().propertyName), paramId);
        }
        else {
            for (const pk of dbSet.primaryKeys) {
                const d = new EqualExpression(new MemberAccessExpression(param, pk.propertyName), new MemberAccessExpression(paramId, pk.propertyName));
                andExp = andExp ? new AndExpression(andExp, d) : d;
            }
        }
        const predicate = new FunctionExpression(andExp, [param]);
        return this.parameter({ id }).where(predicate).deferredFirst();
    }
    public deferredFirst(predicate?: (item: T) => boolean) {
        const query = predicate ? this.where(predicate) : this;
        return new FirstDeferredQuery(query);
    }
    public deferredMax(selector?: (item: T) => number) {
        const query = selector ? this.select(selector) : this as unknown as Queryable<number>;
        return new MaxDeferredQuery(query);
    }
    public deferredMin(selector?: (item: T) => number) {
        const query = selector ? this.select(selector) : this as unknown as Queryable<number>;
        return new MinDeferredQuery(query);
    }
    public deferredSum(selector?: (item: T) => number) {
        const query = selector ? this.select(selector) : this as unknown as Queryable<number>;
        return new SumDeferredQuery(query);
    }
    //#endregion

    //#region deferred
    public deferredToArray() {
        return new ToArrayDeferredQuery(this);
    }
    public deferredToMap<K, V>(keySelector: (item: T) => K, valueSelector?: (item: T) => V) {
        if (!valueSelector) {
            valueSelector = (o: any) => o;
        }
        return new ToMapDeferredQuery(this, keySelector, valueSelector);
    }
    public deferredUpdate(setter: ResultSelector<T, T>): DeferredQuery<number> {
        return new BulkUpdateDeferredQuery(this, setter);
    }
    public deferredDelete(mode: DeleteMode): DeferredQuery<number>;
    public deferredDelete(predicate?: (item: T) => boolean, mode?: DeleteMode): DeferredQuery<number>;
    public deferredDelete(modeOrPredicate?: DeleteMode | ((item: T) => boolean), mode?: DeleteMode) {
        let predicate: (item: T) => boolean = null;
        if (modeOrPredicate) {
            if (modeOrPredicate instanceof Function) {
                predicate = modeOrPredicate;
            }
            else {
                mode = modeOrPredicate;
            }
        }

        const query = predicate ? this.where(predicate) : this;
        return new BulkDeleteDeferredQuery(query, mode);
    }
    public deferredInsertInto<TR>(type: IObjectType<TR>, selector: ResultSelector<T, TR>): InsertIntoDeferredQuery<TR> {
        const query = this.select(selector);
        return new InsertIntoDeferredQuery(query, type);
    }
    public async delete(mode: DeleteMode): Promise<number>;
    public async delete(predicate?: (item: T) => boolean, mode?: DeleteMode): Promise<number>;
    public async delete(modeOrPredicate?: DeleteMode | ((item: T) => boolean), mode?: DeleteMode) {
        const query = this.deferredDelete(modeOrPredicate as any, mode);
        return await query.execute();
    }
    public async find(id: ValueType | ObjectLike<T>) {
        const query = this.deferredFind(id);
        return await query.execute();
    }
    public async first(predicate?: (item: T) => boolean) {
        const query = this.deferredFirst(predicate);
        return await query.execute();
    }
    public abstract hashCode(): number;
    public async insertInto<TR>(type: IObjectType<TR>, selector: ResultSelector<T, TR>) {
        const query = this.deferredInsertInto(type, selector);
        return await query.execute();
    }
    public async max(selector?: (item: T) => number) {
        const query = this.deferredMax(selector);
        return await query.execute();
    }
    public async min(selector?: (item: T) => number) {
        const query = this.deferredMin(selector);
        return await query.execute();
    }
    public async sum(selector?: (item: T) => number) {
        const query = this.deferredSum(selector);
        return await query.execute();
    }
    public async toArray(): Promise<T[]> {
        const query = this.deferredToArray();
        return await query.execute();
    }
    public async toMap<K, V>(keySelector: (item: T) => K, valueSelector?: (item: T) => V): Promise<Map<K, V>> {
        const query = this.deferredToMap(keySelector, valueSelector);
        return await query.execute();
    }
    public toString() {
        const defer = this.deferredToArray();
        this.dbContext.deferredQueries.delete(defer);
        return defer.toString();
    }
    public async update(setter: ResultSelector<T, T>) {
        const query = this.deferredUpdate(setter);
        return await query.execute();
    }
    //#endregion
}

import "./Queryable.partial";
