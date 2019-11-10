import { ColumnGeneration } from "../Common/Enum";
import { INodeTree, ParameterStack } from "../Common/ParameterStack";
import { DeleteMode } from "../Common/StringType";
import { FlatObjectLike, IObjectType, ObjectLike, ValueType } from "../Common/Type";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { Enumerable } from "../Enumerable/Enumerable";
import { IEnumerable } from "../Enumerable/IEnumerable";
import { hashCode, isNull, isValue } from "../Helper/Util";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { BulkDeferredQuery } from "../Query/DeferredQuery/BulkDeferredQuery";
import { DeferredQuery } from "../Query/DeferredQuery/DeferredQuery";
import { DMLDeferredQuery } from "../Query/DeferredQuery/DMLDeferredQuery";
import { IQueryOption } from "../Query/IQueryOption";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { Queryable } from "../Queryable/Queryable";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { QueryExpression } from "../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { DbContext } from "./DbContext";
import { EntityEntry } from "./EntityEntry";

export class DbSet<T> extends Queryable<T> {
    public get stackTree(): INodeTree<ParameterStack> {
        return this._param;
    }
    public get dbContext(): DbContext {
        return this._dbContext;
    }
    public get local(): IEnumerable<T> {
        return Enumerable.from(this.dictionary).select((o) => o[1].entity);
    }
    public get metaData() {
        if (!this._metaData) {
            this._metaData = Reflect.getOwnMetadata(entityMetaKey, this.type);
        }
        return this._metaData;
    }
    public get primaryKeys(): Array<IColumnMetaData<T>> {
        return this.metaData.primaryKeys;
    }
    public get queryOption(): IQueryOption {
        return {};
    }
    constructor(public readonly type: IObjectType<T>, dbContext: DbContext) {
        super(type);
        this._dbContext = dbContext;
        this._param = {
            node: new ParameterStack(),
            childrens: []
        };
    }
    protected dictionary: Map<string, EntityEntry<T>> = new Map();
    private _param: INodeTree<ParameterStack>;
    private readonly _dbContext: DbContext;
    private _metaData: EntityMetaData<T>;
    public buildQuery(visitor: IQueryVisitor): QueryExpression<T[]> {
        const result = new SelectExpression(new EntityExpression(this.type, visitor.newAlias()));
        result.parameterTree = {
            node: [],
            childrens: []
        };
        visitor.setDefaultBehaviour(result);
        return result;
    }
    public clear() {
        this.dictionary = new Map();
    }
    // simple delete.
    public deferredDelete(mode: DeleteMode): DeferredQuery<number>;
    public deferredDelete(key: FlatObjectLike<T>, mode?: DeleteMode): DeferredQuery<number>;
    public deferredDelete(predicate?: (item: T) => boolean, mode?: DeleteMode): DeferredQuery<number>;
    public deferredDelete(modeOrKeyOrPredicate?: FlatObjectLike<T> | ((item: T) => boolean) | DeleteMode, mode?: DeleteMode): DeferredQuery<number> {
        if (modeOrKeyOrPredicate instanceof Function || typeof modeOrKeyOrPredicate === "string") {
            return super.deferredDelete(modeOrKeyOrPredicate as () => boolean, mode);
        }
        else {
            return this.dbContext.getDeleteQuery(this.entry(modeOrKeyOrPredicate as FlatObjectLike<T>), mode);
        }
    }
    public deferredInsert(...items: Array<ObjectLike<T>>) {
        if (items.any()) {
            throw new Error("empty items");
        }
        if (!Reflect.getOwnMetadata(entityMetaKey, this.type)) {
            throw new Error(`Only entity supported`);
        }

        const defers: Array<DMLDeferredQuery<any>> = [];
        for (const item of items) {
            const entry = this.dbContext.entry(item);
            defers.push(this.dbContext.getInsertQuery(entry));
        }
        return new BulkDeferredQuery(this.dbContext, defers);
    }
    // Prevent Update all records
    public update(item: ObjectLike<T>) {
        return this.deferredUpdate(item).execute();
    }
    // Prevent Update all records
    public deferredUpdate(item: ObjectLike<T>) {
        return this.dbContext.getUpdateQuery(this.dbContext.entry(item));
    }
    public deferredUpsert(item: ObjectLike<T>) {
        return this.dbContext.getUpsertQuery(this.dbContext.add(item));
    }
    public entry(entity: T | FlatObjectLike<T>) {
        const key = this.getKey(entity);
        let entry = this.dictionary.get(key);
        if (entry) {
            if (entry.entity !== entity) {
                entry.setOriginalValues(entity);
            }
        }
        else {
            if (!(entity instanceof this.type)) {
                const entityType = new this.type();
                entry = new EntityEntry<T>(this, entityType, key);
                entry.setOriginalValues(entity);
            }
            else {
                entry = new EntityEntry<T>(this, entity, key);
            }
            this.dictionary.set(key, entry);
        }
        return entry;
    }
    public async find(id: ValueType | FlatObjectLike<T>, forceReload?: boolean) {
        let entity = forceReload ? null : this.findLocal(id);
        if (!entity) {
            entity = await super.find(id);
        }
        return entity;
    }
    public findLocal(id: ValueType | FlatObjectLike<T>): T {
        const key = this.getKey(id);
        const entry = this.dictionary.get(key);
        return entry ? entry.entity : undefined;
    }
    public getKey(id: ValueType | ObjectLike<T>): string {
        if (isNull(id)) {
            throw new Error("Parameter cannot be null");
        }
        if (isValue(id)) {
            return id.toString();
        }

        let keyString = "";
        let useReference = false;
        for (const o of this.primaryKeys) {
            const val = id[o.propertyName];
            if (!val) {
                if (o.generation & ColumnGeneration.Insert) {
                    useReference = true;
                }
                else {
                    throw new Error(`primary key "${o.propertyName}" required`);
                }
                break;
            }
            else {
                keyString += val.toString() + "|";
            }
        }

        if (useReference) {
            return id as any;
        }
        return keyString.slice(0, - 1);
    }
    public hashCode() {
        return hashCode(this.type.name!);
    }

    public insert(...items: Array<ObjectLike<T>>) {
        return this.deferredInsert(...items).execute().then((o) => o.sum());
    }
    public new(primaryValue: ValueType | ObjectLike<T>) {
        const entity = new this.type();
        if (isValue(primaryValue)) {
            if (this.primaryKeys.length !== 1) {
                throw new Error(`${this.type.name} has multiple primary keys`);
            }

            entity[this.primaryKeys.first().propertyName] = primaryValue as unknown as T[keyof T];
        }
        else {
            if (this.primaryKeys.any((o) => !(o.generation & ColumnGeneration.Insert) && !o.defaultExp && !primaryValue[o.propertyName])) {
                throw new Error(`Primary keys is required`);
            }

            for (const prop in primaryValue) {
                entity[prop] = primaryValue[prop] as unknown as T[keyof T];
            }
        }
        this.dbContext.add(entity);
        return entity;
    }
    public updateEntryKey(entry: EntityEntry<T>) {
        this.dictionary.delete(entry.key);
        entry.key = this.getKey(entry.entity);
        this.dictionary.set(entry.key, entry);
    }

    public upsert(item: ObjectLike<T>) {
        return this.deferredUpsert(item).execute();
    }
}
