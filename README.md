# Elcy
Elcy is an [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) 
for typescript and javascript that is intend to be platform independent and follow ECMAScript standard (ES5, ES6, ES7). Elcy is highly influenced by [Entity Framework](https://www.asp.net/entity-framework) and [NHibernate](http://nhibernate.info/).

## Installation
To be updated...

## Supported Database
- Sql Server
- Sqlite (not yet)

## How to use

### Create the Model

Entity on your model is mark with `@Entity` class decorator. 

To add database columns, you simply need to add decorator to your entity properties. Elcy has several column decorator for defining your column with specific column type:
- `@StringColumn` : string column type.
- `@BooleanColumn` : boolean column type.
- `@NumberColumn` : integer column type.
- `@DecimalColumn` : decimal column type.
- `@ApproximateNumberColumn` : approximate number column type. ex: float
- `@IdentifierColumn` : uuid column type.
- `@DateColumn` : date column type.
- `@EnumColumn` : *not implemented yet*
- `@EmbeddedColumn` : *not implemented yet*

Here several other decorator for entity property:
- `@CreatedDate`: a date column type used to store entity creation date.
- `@ModifiedDate`: a date column type used to store entity last modified date.
- `@ColumnDescription`: add description to column.
- `@DeletedColumn`: a boolean column type used for soft delete indicator.
- `@NullableColumn`: mark column nullable.
- `@PrimaryKey`: mark column as one of the entity primary key.

Example:
```typescript
import {Entity} from "elcy/Decorator/Entity";
import { PrimaryKey } from "Elcy/Decorator/Column/PrimaryKey";
import { NumberColumn } from "Elcy/Decorator/Column/NumberColumn";
import { DateColumn } from "Elcy/Decorator/Column/DateColumn";
import { IdentifierColumn } from "Elcy/Decorator/Column/IdentifierColumn";
import { UUID } from "Elcy/Data/UUID";

@Entity()
export class Order {
    @PrimaryKey()
    @IdentifierColumn()
    public OrderId: UUID;

    @NumberColumn({ columnType: "bigint" })
    public Amount: number;

    @DateColumn()
    public OrderDate: Date;
    @CreatedDate()
    public CreatedDate: Date;
    @ModifiedDate()
    public ModifiedDate: Date;
    @DeletedColumn()
    public isDeleted: boolean;
}
```

### Create a Context

a Context represents a session with the database, allowing us to query and save data. Define a context that derives from `Elcy/Data/DbContext` and exposes a typed DbSet<TEntity> for each class in our model. Elcy has defined DbContext that you could used for each support db under `Elcy/Driver`.

Example:
```typescript
import { MssqlDbContext } from "Elcy/Driver/Mssql";

export class MyDb extends MssqlDbContext {
    constructor() {
        super(() => new MssqlDriver({
            host: "localhost\\SQLSERVER",
            database: "mydb",
            port: 1433, // example
            user: "xxx",
            password: "xxx",
        }));
    }
    public entityTypes = [Order]; // all entities that will be loaded using this context.
    public orders: DbSet<Order> = this.set(Order); // exposed typed DbSet for Order model.
}
```

### Reading Data

Elcy used Linq-like syntax to read data from database. Example:

```typescript
(
    async() => {
        const db = new MyDb();

        // select top 10 order with Amount > 10 order by amount desc.
        const orders = await db.orders.take(10).where(o => o.Amount > 10).orderBy([o => o.Amount, "DESC"]).toArray();

        // count all orders
        const count = await db.orders.count();
        
        // where with parameter
        const maxAmount = 10;
        const count = await db.orders.parameters({ maxAmount }).where(o => o.Amount < maxAmount).count();
    }
)();
```

Below are the supported query expression syntax:
- `where(predicate: (item: T) => boolean): Queryable<T>`
- `distinct(): Queryable<T>`
- `include(...includes: Array<(item: T) => any>): Queryable<T>`
- `orderBy(...selectors: IQueryableOrderDefinition<T>[]): Queryable<T>`
- `skip(skip: number): Queryable<T>`
- `take(take: number): Queryable<T>`
- `select<TReturn>(selector: ((item: T) => TReturn)): Queryable<TReturn>`
- `selectMany<TReturn>(selector: (item: T) => TReturn[]): Queryable<TReturn>`
- `groupBy<K>(keySelector: (item: T) => K): Queryable<IGroupArray<T, K>>`: limitation. groupBy(..).toArray() will not work.
- `union(array2: Queryable<T>, isUnionAll?: boolean): Queryable<T>`
- `intersect(array2: Queryable<T>): Queryable<T>`
- `except(array2: Queryable<T>): Queryable<T>`
- `toArray()`
- `sum()`
- `count()`
- `max()`
- `min()`
- `avg()`
- `all()`
- `any()`
- `first()`
- `innerJoin`: *not yet supported*
- `rightJoin`: *not yet supported*
- `leftJoin`: *not yet supported*
- `fullJoin`: *not yet supported*
- `pivot`: *not yet supported*

### Writing Data

Create:
```typescript
(
    async() => {
        const db = new MyDb();

        // example 1: create and attach
        const order = new Order();
        order.OrderId = UUID.new();
        order.Amount = 10;
        db.add(order);

        // example 2
        const order2 = db.orders.new(UUID.new());
        order2.Amount = 10;

        db.saveChanges();
    }
)();
```

Update
```typescript
(
    async() => {
        const db = new MyDb();

        const order = db.orders.first();
        order.Amount += 1;
        
        db.saveChanges();
    }
)();
```

Delete
```typescript
(
    async() => {
        const db = new MyDb();

        const order = db.orders.first();
        db.delete(order);
        db.saveChanges();
    }
)();
```

### Transaction

```typescript
(
    async() => {
        const db = new MyDb();

        await db.transaction(o => {
            // your code goes here
        });
    }
)();
```
