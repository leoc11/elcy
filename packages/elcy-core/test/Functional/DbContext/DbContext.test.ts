import { describe, it, expect, afterEach, beforeAll, afterAll, vi, test } from "bun:test";
import { DefaultQueryCacheManager } from "../../../src/Cache/DefaultQueryCacheManager";
import { DefaultResultCacheManager } from "../../../src/Cache/DefaultResultCacheManager";
import { EntityState } from "../../../src/Data/EntityState";
import { Uuid } from "../../../src/Data/Uuid";
import { mockContext } from "../../fixture/mock/MockContext";
import { PostgresqlContext, Table1, Table1Many, Table1Table2 } from "../../fixture";
import { IQuery } from "packages/elcy-core/src/Query/IQuery";
import { beforeEach } from "node:test";
import { EntityEntry } from "packages/elcy-core/src/Data/EntityEntry";

const db = new PostgresqlContext();
mockContext(db);
beforeEach(async () => {
    db.connection = await db.getConnection();
})
afterEach(() => {
    db.clear();
    vi.restoreAllMocks();
    db.closeConnection();
});
describe("DBCONTEXT", () => {
    describe("CONTEXT", async () => {
        test("clear", () => {
            const entity = db.table1s.new({
                id: 1n
            });
            db.detach(entity);
            const entry = db.attach(entity);
            entity.date = new Date();

            const setData = entry.dbSet["dictionary"] as Map<string, EntityEntry>;
            expect(db.entityEntries.hasChanges()).toBeTrue();
            expect(setData.size).toBeGreaterThan(0);

            db.clear();

            expect(db.entityEntries.hasChanges()).toBeFalse();
            expect(setData.size).toBe(0);
        });
    });
    describe("ENTITY ENTRY", async () => {
        it("should attach entity", () => {
            const entity = db.table1s.new({
                id: 1n
            });
            db.detach(entity);
            const entry = db.attach(entity);
            expect(entry.state).toBe(EntityState.Unchanged);
        });
        it("should attach and mark entity added", () => {
            const entity = db.table1s.new({
                id: 1n
            });
            db.detach(entity);
            const entry = db.add(entity);
            expect(entry.state).toBe(EntityState.Added);
        });
        it("should attach and mark entity updated", () => {
            const entity = db.table1s.new({
                id: 1n
            });
            db.detach(entity);
            const entry = db.update(entity);
            expect(entry.state).toBe(EntityState.Modified);
        });
        it("should mark entity deleted", () => {
            const entity = db.table1s.new({
                id: 1n
            });
            db.detach(entity);
            const entry = db.delete(entity);
            expect(entry.state).toBe(EntityState.Deleted);
        });
        it("should detach entity", () => {
            const entity = db.table1s.new(1n);
            const entry = db.detach(entity);
            expect(entry.state).toBe(EntityState.Detached);
        });
    });
    describe("ENTITY CHANGES DETECTION", async () => {
        it("should detect property changes and reset", () => {
            const entity = db.table1s.new({
                id: 1n,
                dateTime: null
            });
            db.detach(entity);
            const entry = db.attach(entity);
            expect(entry.state).toBe(EntityState.Unchanged);

            entity.dateTime = new Date();
            expect(entry.state).toBe(EntityState.Modified);
            expect(entry.getModifiedProperties()).toContainEqual("dateTime");
            expect(entry.getOriginalValue("dateTime")).toBe(null);

            entry.resetChanges();
            expect(entry.state).toBe(EntityState.Unchanged);
            expect(entity.dateTime).toBe(null);
            expect(entry.getModifiedProperties()).toEqual([]);
        });
        it("should not detect property changes for readonly property", () => {
            const entity = db.table2s.new({
                id: 1,
                rowVersion: Uuid.new()
            });
            db.detach(entity);
            const entry = db.attach(entity);
            expect(entry.state).toBe(EntityState.Unchanged);

            entity.rowVersion = Uuid.new();
            expect(entry.state).toBe(EntityState.Unchanged);
        });
        it("should detect changes for delete property", () => {
            const entity = db.table1s.new({
                id: 1n,
                deleted: false
            });
            db.detach(entity);
            const entry = db.attach(entity);
            expect(entry.state).toBe(EntityState.Unchanged);

            entity.deleted = true;
            expect(entry.state).toBe(EntityState.Deleted);
        });
        it("should detect relation changes", () => {
            const entity = db.table1Manies.new({
                id: 1n,
                table1Id: null,
                deleted: false
            });
            db.detach(entity);
            const entry = db.attach(entity);

            expect(entity.table1Id).toBeNull();

            const table1 = db.table1s.new({
                id: 10n,
                deleted: false
            });;
            entity.table1 = table1;
            expect(entity.table1Id).toBe(table1.id);
            expect(entry.state).toBe(EntityState.Modified);
        });
    });
    describe("ENTITY ENTRY", async () => {
        it("should reload all properties", async () => {
            db.connection = await db.getConnection();
            const spy = vi.spyOn(db.connection, "query");
            const entity = db.table1s.new({
                id: 1n,
                deleted: false
            });
            db.detach(entity);
            const entry = db.attach(entity);
            await entry.reload();

            const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
            expect(queries).toMatchSnapshot();

            expect(entity).toHaveProperty("string");
            expect(entity.string).toBeString();

            expect(entity).toHaveProperty("integer");
            expect(entity.integer).toBeNumber();
        });
        it("should load to-one relation", async () => {
            db.connection = await db.getConnection();
            const spy = vi.spyOn(db.connection, "query");
            const entity = db.table1Manies.new({
                id: 1n,
                table1Id: null,
                deleted: false
            });
            db.detach(entity);
            const entry = db.attach(entity);

            await entry.loadRelated((o) => o.table1);

            const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
            expect(queries).toMatchSnapshot();

            expect(entity.table1).toBeInstanceOf(Table1);
        });
        it("should load to-many relation", async () => {
            db.connection = await db.getConnection();
            const spy = vi.spyOn(db.connection, "query");
            const entity = db.table1s.new({
                id: 1n,
                deleted: false
            });
            db.detach(entity);
            const entry = db.attach(entity);

            await entry.loadRelated((o) => o.table1Manies);

            const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
            expect(queries).toMatchSnapshot();

            expect(entity.table1Manies).toBeInstanceOf(Array);
            expect(entity.table1Manies.length).toBeGreaterThan(0);
            for (const o of entity.table1Manies) {
                expect(o).toBeInstanceOf(Table1Many);
            }
        });
        it("should load multiple relations", async () => {
            db.connection = await db.getConnection();
            const spy = vi.spyOn(db.connection, "query");

            const entity = db.table2s.new({
                id: 1
            });
            db.detach(entity);
            const entry = db.attach(entity);

            await entry.loadRelated((o) => o.table1Table2s.withRelated((od) => od.table1));

            const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
            expect(queries).toMatchSnapshot();

            expect(entity.table1Table2s).toBeInstanceOf(Array);
            expect(entity.table1Table2s.length).toBeGreaterThan(0);
            for (const o of entity.table1Table2s) {
                expect(o).toBeInstanceOf(Table1Table2);
                expect(o).toHaveProperty("table1");
                expect(o.table1).toBeInstanceOf(Table1);
            }
        });
    });
    describe("QUERY CACHE", async () => {
        beforeAll(async () => {
            db.queryCacheManagerFactory = () => new DefaultQueryCacheManager();
        });
        afterAll(async () => {
            db.queryCacheManagerFactory = null;
        });
        it("should cached query", async () => {
            const groupBy = db.table1Manies.slice(0, 100).filter((o) => o.integer > 10000).map((o) => o.table1).groupBy((o) => o.dateTime.getFullYear()).map((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.filter((o) => o.decimalNumber < 10000).sum((o) => o.decimalNumber)
            }));
            groupBy.toString();
            const queryCache = db.queryCacheManager.get(groupBy.hashCode());
            expect(queryCache).not.toBe(null);
        });
        it("should use same query cache for diff take skip value", async () => {
            // build string with it's query cache
            db.table1s.slice(0, 10).slice(4).toString();
            const take = db.table1s.slice(0, 1).slice(2);
            const cache = db.queryCacheManager.get(take.hashCode());

            expect(cache).not.toBeNull();
            expect(cache).not.toBeUndefined();
        });
        it("should used cached query for same query", async () => {
            const groupBy = db.table1Manies.slice(0, 100).filter((o) => o.integer > 10000).map((o) => o.table1).groupBy((o) => o.dateTime.getFullYear()).map((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.filter((o) => o.decimalNumber < 10000).sum((o) => o.decimalNumber)
            }));
            const spy = vi.spyOn(groupBy, "buildQuery");
            groupBy.toString();
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("RESULT CACHE", async () => {
        beforeAll(async () => {
            db.resultCacheManagerFactory = () => new DefaultResultCacheManager();
        });
        afterAll(async () => {
            db.resultCacheManagerFactory = null;
        });
        it("should cached result", async () => {
            const groupBy = db.table1Manies.slice(0, 100).filter((o) => o.integer > 10000).map((o) => o.table1).groupBy((o) => o.dateTime.getFullYear()).map((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.filter((o) => o.decimalNumber < 10000).sum((o) => o.decimalNumber)
            }));
            const deferredQuery = groupBy.deferredToArray();
            await deferredQuery.execute();
            const resultCache = await db.resultCacheManager.get(deferredQuery.hashCode().toString());
            expect(resultCache).not.toBeNull();
        });
        it("should used cached result for same query", async () => {
            const groupBy = db.table1Manies.slice(0, 100).filter((o) => o.integer > 10000).map((o) => o.table1).groupBy((o) => o.dateTime.getFullYear()).map((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.filter((o) => o.decimalNumber < 10000).sum((o) => o.decimalNumber)
            }));
            const spy = vi.spyOn(db, "executeQueries");
            await groupBy.toArray();
            expect(spy).not.toHaveBeenCalled();
        });
    });
});
