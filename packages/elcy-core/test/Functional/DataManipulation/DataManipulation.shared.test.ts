import { beforeEach, afterEach, describe, it, expect, vi } from "bun:test";
import { IConnection } from "../../../src/Connection/IConnection";
import { PooledConnection } from "../../../src/Connection/PooledConnection";
import { ISaveEventParam } from "../../../src/MetaData/Interface/ISaveEventParam";
import { MockConnection } from "../../fixture/mock/MockConnection";
import { mockContext } from "../../fixture/mock/MockContext";
import { IQuery } from "../../../src/Query/IQuery";
import { getEntityMetadata, getRelationMetadata } from "../../../src/MetaData/MetaDataMapper";
import { CycleDigon1, CycleDigon2, CyclePolygon1, CyclePolygon2, CyclePolygon4, CyclePolygon5, CycleSelf, CycleSelfAuto, CycleSelfAutoNull, CycleTriangle1, CycleTriangle2, CycleTriangle3, Table1, Table1Many, Table1One, Table2, Unblock } from "../../fixture/model";
import { ITestContext } from "../../fixture";
import { Temporal } from "../../../src/Data/Temporal";
import { matchSnapShot } from "../../fixture/Utilities";
import { Enumerable } from "@elcy/enumerable";
import { EntityState } from "../../../src/Data/EntityState";
import { BatchedQuery } from "../../../src/Query/BatchedQuery";
import { QueryType, UpsertStrategy } from "../../../src/Common/Enum";
import { IDeleteEventParam } from "../../../src/MetaData/Interface/IDeleteEventParam";
import { MysqlDbContext } from "../../../src/Provider/Mysql/MysqlDbContext";

export const dataManipulationTest = (db: ITestContext) => {
    mockContext(db);
    beforeEach(async () => {
        db.connection = null;
        db.connection = await db.getConnection();
        db.connectionManager.getAllConnections = () => Promise.resolve([db.connection]);
    });
    afterEach(() => {
        db.clear();
        vi.restoreAllMocks();
        db.closeConnection();
    });
    const getConnection = (con: IConnection) => (con instanceof PooledConnection ? con.connection : con) as MockConnection;

    describe("DATA MANIPULATION", () => {
        describe("INSERT", () => {
            it("should insert new entity 1", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const effected = await db.table1Ones.insert({
                    table1Id: 1n,
                    name: "TEST1",
                    number: 10
                });

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should insert new entity 2", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const data = new Table1One();
                data.table1Id = 2n;
                data.name = "TEST2";
                data.number = 20;
                const entry = db.add(data);
                expect(entry.state).toBe(EntityState.Added);

                const effected = await db.saveChanges();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should insert new entity 3", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const entity = db.table1Ones.new({
                    table1Id: 3n,
                    name: "TEST3",
                    number: 30
                });
                const entry = db.entry(entity);
                expect(entry.state).toBe(EntityState.Added);
                const effected = await db.saveChanges();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should insert new entity and update all insert generated column (createdDate, default)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const data = db.table1s.new({
                    string: "INSERT 1",
                    createdDate: null,
                    modifiedDate: null
                });
                const effected = await db.saveChanges();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
                expect(data).toHaveProperty("deleted", false);
                expect(data).toHaveProperty("integer", 1);
                expect(data).toHaveProperty("createdDate");
                expect(data.createdDate).toBeInstanceOf(Temporal.Instant);
                expect(data).toHaveProperty("modifiedDate");
                expect(data.modifiedDate).toBeInstanceOf(Temporal.Instant);
                expect(data).toHaveProperty("id");
                expect(typeof data.id).toBe("bigint");
                expect(data.id).toBeGreaterThan(0);
            });
            it("should insert entity with it relation correctly", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const data = await db.table1s.find(10n);
                const detail1 = db.table1Manies.new({
                    name: "detail 1",
                    integer: 1
                });
                const detail2 = db.table1Manies.new({
                    name: "detail 2",
                    integer: 2
                });

                detail1.table1 = data;
                data.table1Manies.push(detail2);

                const effected = await db.saveChanges();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(2);

                expect(data).toHaveProperty("deleted", false);
                expect(data).toHaveProperty("integer", 1);
                expect(data).toHaveProperty("createdDate");
                expect(data.createdDate).toBeInstanceOf(Temporal.Instant);
                expect(data).toHaveProperty("modifiedDate");
                expect(data.modifiedDate).toBeInstanceOf(Temporal.Instant);
                expect(data).toHaveProperty("id");
                expect(typeof data.id).toBe("bigint");
                expect(data.id).toBeGreaterThan(0);
                for (const d of [detail1, detail2]) {
                    expect(d).toHaveProperty("name");
                    expect(typeof d.name).toBe("string");
                    expect(d).toHaveProperty("id");
                    expect(typeof d.id).toBe("bigint");
                    expect(d.id).toBeGreaterThan(0);
                    expect(d.table1Id).toBe(data.id);
                    expect(d.table1).toBe(data);
                }
            });
            it("should insert entity with it relation correctly (auto pk)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const data = db.table1s.new({
                    string: "INSERT 1",
                    createdDate: null,
                    modifiedDate: null
                });
                const detail1 = db.table1Manies.new({
                    name: "detail 1",
                    integer: 1
                });
                const detail2 = db.table1Manies.new({
                    name: "detail 2",
                    integer: 2
                });

                data.table1Manies = [];
                data.table1Manies.push(detail1);
                detail1.table1 = data;
                data.table1Manies.push(detail2);
                detail2.table1 = data;

                const data2 = db.table1s.new({
                    string: "Insert 2",
                    createdDate: null,
                    modifiedDate: null
                });
                const detail21 = db.table1Manies.new({
                    name: "detail 21",
                    integer: 2
                });
                data2.table1Manies = [];
                data2.table1Manies.push(detail21);
                detail21.table1 = data2;

                const effected = await db.saveChanges();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                const flatQueries = queries.flatMap(o => o instanceof BatchedQuery ? Array.from(o.queries) : o);

                const m = [null, null, data.id, data.id, data2.id];
                let ix = 0;
                const matcher = flatQueries.reduce((r, o, i) => {
                    if (o.type & QueryType.ADDITIONAL) {
                        return r;
                    }
                    if (o.type & QueryType.DML) {
                        const checkValue = m[ix++];
                        if (checkValue) {
                            r[i] = {
                                parameters: new Map([[Array.from(o.parameters.keys())[0], checkValue]])
                            };
                        }
                    }

                    return r;
                }, {} as Record<number, unknown>);
                matchSnapShot(flatQueries, matcher);
                expect(effected).toBe(5);

                expect(data).toHaveProperty("deleted", false);
                expect(data).toHaveProperty("integer", 1);
                expect(data).toHaveProperty("createdDate");
                expect(data.createdDate).toBeInstanceOf(Temporal.Instant);
                expect(data).toHaveProperty("modifiedDate");
                expect(data.modifiedDate).toBeInstanceOf(Temporal.Instant);
                expect(data).toHaveProperty("id");
                expect(typeof data.id).toBe("bigint");
                expect(data.id).toBeGreaterThan(0);

                expect(data).toHaveProperty("table1Manies");
                expect(Array.isArray(data.table1Manies)).toBeTrue();
                expect(data.table1Manies).toHaveLength(2);
                for (const d of data.table1Manies) {
                    expect(d).toHaveProperty("name");
                    expect(typeof d.name).toBe("string");
                    expect(d).toHaveProperty("id");
                    expect(typeof d.id).toBe("bigint");
                    expect(d.id).toBeGreaterThan(0);
                    expect(d.table1Id).toBe(data.id);
                    expect(d.table1).toBe(data);
                }
            });
            it("should trigger before/after save event", async () => {
                const entityMetaData = getEntityMetadata(Table1);
                const spy = vi.spyOn(db.connection, "query");
                const spy1 = vi.spyOn(entityMetaData, "beforeSave");
                const spy2 = vi.spyOn(entityMetaData, "afterSave");

                const data = db.table1s.new({
                    string: "Insert 1",
                    createdDate: null,
                    modifiedDate: null
                });
                const effected = await db.saveChanges();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
                expect(spy1).toHaveBeenNthCalledWith(1, data, { type: "insert" } as ISaveEventParam);
                expect(spy2).toHaveBeenNthCalledWith(1, data, { type: "insert" } as ISaveEventParam);
                expect(spy1.mock.invocationCallOrder[0]).toBeLessThan(spy2.mock.invocationCallOrder[0]);
            });
            it("should bulk insert", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const effected = await db.table1s
                    .filter((o) => o.table1Manies.count() <= 0)
                    .map((o) => ({
                        name: "Detail of parent " + o.id
                    }), Table1Many).insertInto(Table1Many);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBeGreaterThan(0);
            });
            it("should bulk insert entity for non auto pk when updating more than 10 entity", async () => {
                const spy = vi.spyOn(db.connection, "query");
                for (const id of Enumerable.range(1, 11)) {
                    db.table1Ones.new({
                        table1Id: BigInt(id),
                        name: `TEST${id}`,
                        number: id * 10
                    });
                }

                const effected = await db.saveChanges();
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(11);
            });
            it("should do upsert", async () => {
                const spy = vi.spyOn(db.connection, "query");

                db.table1s.new({
                    id: 1n,
                    string: "Original",
                    integer: 11
                });
                const effected = await db.saveChanges({
                    upsertStrategy: UpsertStrategy.Insert
                });
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should insert entity with loop type reference", async () => {
                const spy = vi.spyOn(db.connection, "query");

                // self reference
                db.set(CycleSelf).new({
                    id: 1n,
                    parentId: 2n,
                    table1Id: 0n
                });
                db.set(CycleSelf).new({
                    id: 2n,
                    parentId: 1n
                });

                // digon
                db.set(CycleDigon1).new({
                    id: 21n,
                    cycleDigon2Id: 22n,
                    table1Id: 0n
                });
                db.set(CycleDigon2).new({
                    id: 22n,
                    cycleDigon1Id: 21n,
                });

                // cycle triangle
                db.set(CycleTriangle1).new({
                    id: 31n,
                    cycleTriangle2Id: 32n,
                    table1Id: 0n
                });
                db.set(CycleTriangle2).new({
                    id: 32n,
                    cycleTriangle3Id: 33n
                });
                db.set(CycleTriangle3).new({
                    id: 33n,
                    cycleTriangle1Id: 31n,
                    cyclePolygon4Id: 54n,
                });

                // cycle polygon
                db.set(CyclePolygon1).new({
                    id: 51n,
                    cyclePolygon2Id: 52n
                });
                db.set(CyclePolygon2).new({
                    id: 52n,
                    cycleTriangle3Id: 33n
                });
                db.set(CyclePolygon4).new({
                    id: 54n,
                    cyclePolygon5Id: 55n
                });
                db.set(CyclePolygon5).new({
                    id: 55n,
                    cyclePolygon1Id: 51n
                });
                const effected = await db.saveChanges();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(11);
            });
            it.skip("should insert default identity entity", async () => {
                throw "Not supported yet";
            });
            it("should insert entity with auto pk and self reference nullable", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const mockConnection = db.connection as MockConnection;
                // self reference
                const c1 = db.set(CycleSelfAutoNull).new({
                    parentId: 1n,
                    name: "1"
                });
                const c2 = db.set(CycleSelfAutoNull).new({
                    name: "2"
                });
                c2.cycleSelfAutoNull = c1;
                const c3 = db.set(CycleSelfAutoNull).new({
                    name: "3"
                });
                c3.cycleSelfAutoNull = c2;
                const c4 = db.set(CycleSelfAutoNull).new({
                    name: "4"
                });
                c4.cycleSelfAutoNull = c3;
                const c5 = db.set(CycleSelfAutoNull).new({
                    name: "5"
                });
                c5.cycleSelfAutoNull = c2;
                const c6 = db.set(CycleSelfAutoNull).new({
                    parentId: 2n,
                    name: "6"
                });
                const c7 = db.set(CycleSelfAutoNull).new({
                    name: "7"
                });
                c7.cycleSelfAutoNull = c6;
                const c8 = db.set(CycleSelfAutoNull).new({
                    name: "8"
                });
                c8.cycleSelfAutoNull = c6;
                if (db instanceof MysqlDbContext) {
                    mockConnection.results = [
                        { effectedRows: 1 },
                        { rows: [{ id: 11n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 12n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 13n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 14n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 15n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 16n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 17n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 18n }] },
                        { effectedRows: 8 },
                    ];
                }
                else {
                    mockConnection.results = [
                        { effectedRows: 1, rows: [{ id: 11n }] },
                        { effectedRows: 1, rows: [{ id: 12n }] },
                        { effectedRows: 1, rows: [{ id: 13n }] },
                        { effectedRows: 1, rows: [{ id: 14n }] },
                        { effectedRows: 1, rows: [{ id: 15n }] },
                        { effectedRows: 1, rows: [{ id: 16n }] },
                        { effectedRows: 1, rows: [{ id: 17n }] },
                        { effectedRows: 1, rows: [{ id: 18n }] },
                        { effectedRows: 8 },
                    ];
                }
                const effected = await db.saveChanges();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(8);
            });
            it("should insert entity with auto pk and self reference", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const mockConnection = db.connection as MockConnection;
                // self reference
                const c1 = db.set(CycleSelfAuto).new({
                    parentId: 1n,
                    name: "1"
                });
                const c2 = db.set(CycleSelfAuto).new({
                    name: "2"
                });
                c2.cycleSelfAuto = c1;
                const c3 = db.set(CycleSelfAuto).new({
                    name: "3"
                });
                c3.cycleSelfAuto = c2;
                const c4 = db.set(CycleSelfAuto).new({
                    name: "4"
                });
                c4.cycleSelfAuto = c2;
                const c5 = db.set(CycleSelfAuto).new({
                    name: "5"
                });
                c5.cycleSelfAuto = c3;
                const c6 = db.set(CycleSelfAuto).new({
                    parentId: 2n,
                    name: "6"
                });
                const c7 = db.set(CycleSelfAuto).new({
                    name: "7"
                });
                c7.cycleSelfAuto = c6;
                const c8 = db.set(CycleSelfAuto).new({
                    name: "8"
                });
                c8.cycleSelfAuto = c6;
                if (db instanceof MysqlDbContext) {
                    mockConnection.results = [
                        { effectedRows: 1 },
                        { rows: [{ id: 11n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 16n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 12n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 17n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 18n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 13n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 14n }] },
                        { effectedRows: 1 },
                        { rows: [{ id: 15n }] },
                    ];
                }
                else {
                    mockConnection.results = [
                        { effectedRows: 1, rows: [{ id: 11n }] },
                        { effectedRows: 1, rows: [{ id: 16n }] },
                        { effectedRows: 1, rows: [{ id: 12n }] },
                        { effectedRows: 1, rows: [{ id: 17n }] },
                        { effectedRows: 1, rows: [{ id: 18n }] },
                        { effectedRows: 1, rows: [{ id: 13n }] },
                        { effectedRows: 1, rows: [{ id: 14n }] },
                        { effectedRows: 1, rows: [{ id: 15n }] },
                    ];
                }
                const effected = await db.saveChanges();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(8);
            });
            it.skip("should insert entity with auto pk, self reference, loop reference", async () => {
                throw "Not supported yet. need insert null + update";
            });
            it.skip("should insert entity with auto pk, loop type reference, full entity type", async () => {
                throw "Not supported yet";
            });
            it.skip("should insert entity with auto pk, loop type reference, partial entity type", async () => {
                throw "Not supported yet";
            });
        });
        describe("UPDATE", () => {
            it("should update entity 1", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const entity = db.table1Ones.new({
                    table1Id: 1n,
                    name: "Original",
                    number: 11
                });
                const entry = db.entry(entity);
                entry.state = EntityState.Unchanged;
                entity.name = "Updated";
                expect(entry.state as EntityState).toBe(EntityState.Modified);

                const effected = await db.saveChanges();
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should update entity 2", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const effected = await db.table1Ones.update({
                    table1Id: 1n,
                    name: "Updated",
                    number: 11
                });

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should bulk update entity", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const effected = await db.table1Ones.filter((o) => o.table1Id === 1n).update({
                    name: "Updated",
                    number: (o) => o.number + 100
                });

                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should bulk update entity with paging", async () => {
                const spy = vi.spyOn(db.connection, "query");

                let filter = 100;
                let filter2 = 99.99;
                let addition = 100.12;
                const effected = await db.table1s
                    .parameter({ filter, addition, filter2 })
                    .filter((o) => o.integer > filter && o.real === filter2 && (o.real ?? 0) === filter2)
                    .slice(100, 150)
                    .update({
                        string: "Updated",
                        real: (o) => o.real + addition
                    });

                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should update with DIRTY concurrency check", async () => {
                const entityMeta = getEntityMetadata(Table1One);
                entityMeta.concurrencyMode = "OPTIMISTIC DIRTY";

                const spy = vi.spyOn(db.connection, "query");

                const data = new Table1One();
                data.table1Id = 2n;
                data.name = "TEST2";
                data.number = 20;
                const entry = db.entry(data);
                entry.state = EntityState.Unchanged;
                data.name = "Updated";
                expect(entry.state as EntityState).toBe(EntityState.Modified);

                const effected = await db.saveChanges();
                entityMeta.concurrencyMode = undefined;
                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should update with VERSION concurrency check", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const data = new Table2();
                data.id = 1;
                data.t2Name = "Original";
                data.rowVersion = new Uint8Array([1, 200, 0, 0, 100]);
                const entry = db.entry(data);
                entry.state = EntityState.Unchanged;
                data.t2Name = "Updated";
                expect(entry.state as EntityState).toBe(EntityState.Modified);

                const effected = await db.saveChanges();
                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should update with VERSION concurrency check (fallback to ModifiedDate)", async () => {
                const entityMeta = getEntityMetadata(Table1);
                entityMeta.concurrencyMode = "OPTIMISTIC VERSION";

                const spy = vi.spyOn(db.connection, "query");
                const data = new Table1();
                data.id = 1n;
                data.string = "Original";
                data.modifiedDate = new Temporal.Instant(31622400000000000n);
                const entry = db.entry(data);
                entry.state = EntityState.Unchanged;
                data.string = "Updated";
                expect(entry.state as EntityState).toBe(EntityState.Modified);

                const effected = await db.saveChanges();
                entityMeta.concurrencyMode = undefined;
                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should update without concurrency check", async () => {
                const entityMeta = getEntityMetadata(Table1);
                entityMeta.concurrencyMode = "NONE";

                const spy = vi.spyOn(db.connection, "query");
                const data = new Table1();
                data.id = 1n;
                data.string = "Original";
                const entry = db.entry(data);
                entry.state = EntityState.Unchanged;
                data.string = "Updated";
                expect(entry.state as EntityState).toBe(EntityState.Modified);

                const effected = await db.saveChanges();
                entityMeta.concurrencyMode = undefined;
                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should throw concurrency error", async () => {
                const parent = new Table2();
                parent.id = 1;
                parent.t2Name = "Original";
                parent.rowVersion = new Uint8Array([1, 200, 0, 0, 100]);
                const entry = db.entry(parent);
                entry.state = EntityState.Unchanged;
                parent.t2Name = "Updated";
                expect(entry.state as EntityState).toBe(EntityState.Modified);

                const mockConnection = getConnection(db.connection);
                mockConnection.results = [{
                    effectedRows: 0
                }, {
                    effectedRows: 0
                }];
                const promise = db.saveChanges();
                expect(promise).rejects.toThrow("Concurrency Error");
            });
            it("should update ModifiedDate", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const data = new Table1();
                data.id = 1n;
                data.string = "Original";
                const oriModifiedDate = data.modifiedDate = new Temporal.Instant(31622400000000000n);
                const entry = db.entry(data);
                entry.state = EntityState.Unchanged;
                data.string = "Updated";
                expect(entry.state as EntityState).toBe(EntityState.Modified);

                const effected = await db.saveChanges();
                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
                expect(data.modifiedDate).not.toBe(oriModifiedDate);
            });
            it("should not update Readonly Column, ex: CreatedDate", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const data = new Table1();
                data.id = 1n;
                data.string = "Original";
                const entry = db.attach(data);
                data.createdDate = Temporal.Now.instant();
                data.modifiedDate = Temporal.Now.instant();
                expect(entry.state).toBe(EntityState.Unchanged);
                data.createdDate = new Temporal.Instant(31622400000000000n);
                expect(entry.state).toBe(EntityState.Unchanged);
                data.string = "Updated";
                expect(entry.state).toBe(EntityState.Modified);

                const effected = await db.saveChanges();
                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should trigger before/after save event", async () => {
                const entityMetaData = getEntityMetadata(Table1);
                const spy = vi.spyOn(db.connection, "query");
                const spy1 = vi.spyOn(entityMetaData, "beforeSave");
                const spy2 = vi.spyOn(entityMetaData, "afterSave");

                const data = new Table1();
                data.id = 1n;
                data.string = "Original";
                db.attach(data);
                data.string = "Updated";

                const effected = await db.saveChanges();
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
                expect(spy1).toHaveBeenNthCalledWith(1, data, { type: "update" } as ISaveEventParam);
                expect(spy2).toHaveBeenNthCalledWith(1, data, { type: "update" } as ISaveEventParam);
                expect(spy1.mock.invocationCallOrder[0]).toBeLessThan(spy2.mock.invocationCallOrder[0]);
            });
            it("should update entity with it relation correctly", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const entity = db.table1Manies.new({
                    id: 1n,
                    name: "detail 1",
                    integer: 1,
                    table1Id: 0n
                });
                const entry = db.entry(entity);
                entry.state = EntityState.Unchanged;

                const data = await db.table1s.find(1n);
                entity.table1 = data;
                expect(entry.state as EntityState).toBe(EntityState.Modified);

                const effected = await db.saveChanges();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
                expect(entity.table1Id).toBe(data.id);
            });
            it("should update relation value to inserted relation entity's identity", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const entity = db.table1Manies.new({
                    id: 1n,
                    name: "detail 1",
                    integer: 1,
                    table1Id: 1n
                });
                const entry = db.entry(entity);
                entry.state = EntityState.Unchanged;

                const data = db.table1s.new({
                    string: "INSERT 1",
                    createdDate: null,
                    modifiedDate: null
                });
                entity.table1 = data;
                expect(entry.state as EntityState).toBe(EntityState.Modified);

                const effected = await db.saveChanges();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                const flatQueries = queries.flatMap(o => o instanceof BatchedQuery ? Array.from(o.queries) : o);

                const m = [null, data.id];
                let ix = 0;
                const matcher = flatQueries.reduce((r, o, i) => {
                    if (o.type & QueryType.ADDITIONAL) {
                        return r;
                    }
                    if (o.type & QueryType.DML) {
                        const checkValue = m[ix++];
                        if (checkValue) {
                            r[i] = {
                                parameters: new Map([[Array.from(o.parameters.keys())[0], checkValue]])
                            };
                        }
                    }

                    return r;
                }, {} as Record<number, unknown>);
                matchSnapShot(flatQueries, matcher);

                expect(effected).toBe(2);
                expect(entity.table1Id).toBe(data.id);
            });
            it("should do upsert", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const entity = db.table1s.new({
                    id: 1n,
                    string: "Original",
                    integer: 11
                });
                const entry = db.entry(entity);
                entry.state = EntityState.Unchanged;
                entity.string = "Updated";
                expect(entry.state as EntityState).toBe(EntityState.Modified);

                const effected = await db.saveChanges({
                    upsertStrategy: UpsertStrategy.Update
                });
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
        });
        describe("DELETE", () => {
            it("should delete entity (soft delete) + should update modifiedDate", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const data = db.table1s.new({
                    id: 1n,
                    string: "Original"
                });
                const entry = db.entry(data);
                entry.state = EntityState.Unchanged;
                db.delete(data);
                expect(entry.state as EntityState).toBe(EntityState.Deleted);

                const effected = await db.saveChanges();
                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should delete entity (hard delete)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const data = db.table1s.new({
                    id: 1n,
                    string: "Original"
                });
                const entry = db.entry(data);
                entry.state = EntityState.Unchanged;
                db.delete(data);
                expect(entry.state as EntityState).toBe(EntityState.Deleted);

                const effected = await db.saveChanges({
                    forceHardDelete: true
                });
                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should delete entity with key (soft delete)", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const effected = await db.table1s
                    .delete({
                        id: 1n
                    });

                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should delete entity with key (hard delete)", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const effected = await db.table1s
                    .delete({
                        id: 1n
                    }, "hard");

                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should bulk delete entity (soft delete) with paging", async () => {
                const spy = vi.spyOn(db.connection, "query");

                let filter = 100;
                let filter2 = 99.99;
                let addition = 100.12;
                const effected = await db.table1s
                    .parameter({ filter, addition, filter2 })
                    .filter((o) => o.integer > filter && o.real === filter2 && (o.real ?? 0) === filter2)
                    .slice(100, 150)
                    .delete();

                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should bulk delete entity (hard delete) with paging", async () => {
                const spy = vi.spyOn(db.connection, "query");

                let filter = 100;
                let filter2 = 99.99;
                let addition = 100.12;
                const effected = await db.table1s
                    .parameter({ filter, addition, filter2 })
                    .filter((o) => o.integer > filter && o.real === filter2 && (o.real ?? 0) === filter2)
                    .slice(100, 150)
                    .delete("hard");

                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
            });
            it("should bulk delete with include (soft delete)", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const effected = await db.table1s
                    .withRelated((o) => o.table1Manies)
                    .delete((o) => o.id === 1n);

                expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBeGreaterThan(0);
            });
            it("should bulk delete with include (hard delete)", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const effected = await db.table1s
                    .withRelated((o) => o.table1Manies)
                    .filter((o) => o.id === 1n)
                    .delete("hard");

                expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBeGreaterThan(0);
            });
            it("should fail soft delete for not supported entity", async () => {
                const promise = db.table1s
                    .withRelated((o) => o.table1Table2s)
                    .filter((o) => o.id === 1n)
                    .delete("soft");

                expect(promise).rejects.toThrow("'Table1_Table2s' did not support 'Soft' delete");
            });
            it("should not cascade delete entity when not enabled (soft delete)", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const relationMeta = getRelationMetadata(Table1Many, "table1");
                const oriDeleteOption = relationMeta.deleteOption;
                relationMeta.deleteOption = "CASCADE";

                const data = new Table1();
                data.id = 1n;
                db.delete(data);

                const effected = await db.saveChanges();
                expect(spy).toHaveBeenCalledTimes(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                const flatQueries = queries.flatMap(o => o instanceof BatchedQuery ? o.queries : o);
                expect(flatQueries.length).toBe(1);
                expect(queries).toMatchSnapshot();
                expect(effected).toBeGreaterThan(0);
                relationMeta.deleteOption = oriDeleteOption;
            });
            it("should cascade delete entity + relation (soft delete)", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const relationMeta = getRelationMetadata(Table1Many, "table1");
                const oriDeleteOption = relationMeta.deleteOption;
                relationMeta.deleteOption = "CASCADE";

                const data = new Table1();
                data.id = 1n;
                db.delete(data);

                const effected = await db.saveChanges({
                    softDeleteCascade: true
                });
                expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                const flatQueries = queries.flatMap(o => o instanceof BatchedQuery ? o.queries : o);
                expect(flatQueries.length).toBeGreaterThanOrEqual(2);
                expect(queries).toMatchSnapshot();
                expect(effected).toBeGreaterThan(0);
                relationMeta.deleteOption = oriDeleteOption;
            });
            it("should delete with SET NULL option (soft delete)", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const relationMeta = getRelationMetadata(Table1Many, "table1");
                const oriDeleteOption = relationMeta.deleteOption;
                relationMeta.deleteOption = "SET NULL";

                const data = new Table1();
                data.id = 1n;
                db.delete(data);

                const effected = await db.saveChanges({
                    softDeleteCascade: true
                });
                expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                const flatQueries = queries.flatMap(o => o instanceof BatchedQuery ? o.queries : o);
                expect(flatQueries.length).toBeGreaterThanOrEqual(2);
                expect(queries).toMatchSnapshot();
                expect(effected).toBeGreaterThan(0);
                relationMeta.deleteOption = oriDeleteOption;
            });
            it("should delete with SET DEFAULT option (soft delete)", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const relationMeta = getRelationMetadata(Table1Many, "table1");
                const oriDeleteOption = relationMeta.deleteOption;
                relationMeta.deleteOption = "SET DEFAULT";

                const data = new Table1();
                data.id = 1n;
                db.delete(data);

                const effected = await db.saveChanges({
                    softDeleteCascade: true
                });
                expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1);
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                const flatQueries = queries.flatMap(o => o instanceof BatchedQuery ? o.queries : o);
                expect(flatQueries.length).toBeGreaterThanOrEqual(2);
                expect(queries).toMatchSnapshot();
                expect(effected).toBeGreaterThan(0);
                relationMeta.deleteOption = oriDeleteOption;
            });
            it("should trigger before/after delete event", async () => {
                const entityMetaData = getEntityMetadata(Table1);
                const spy = vi.spyOn(db.connection, "query");
                const spy1 = vi.spyOn(entityMetaData, "beforeDelete");
                const spy2 = vi.spyOn(entityMetaData, "afterDelete");

                const data = new Table1();
                data.id = 1n;
                db.delete(data);

                const effected = await db.saveChanges();
                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(1);
                expect(spy1).toHaveBeenNthCalledWith(1, data, { type: "soft" } as IDeleteEventParam);
                expect(spy2).toHaveBeenNthCalledWith(1, data, { type: "soft" } as IDeleteEventParam);
                expect(spy1.mock.invocationCallOrder[0]).toBeLessThan(spy2.mock.invocationCallOrder[0]);
            });
            it("should delete with correct order", async () => {
                const spy = vi.spyOn(db.connection, "query");

                // self reference
                const t1 = await db.table1s
                    .withRelated(o => o.table1Manies.slice(0, 1))
                    .find(10n);
                t1.table1Manies.forEach((o, ix) => {
                    o.id = BigInt(ix + 1);
                    db.entry(o).acceptChanges();
                });

                db.delete(t1);
                db.delete(t1.table1Manies);
                const effected = await db.saveChanges();

                const queries = spy.mock.calls.slice(1).flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(2);
            });
            it.skip("should fail hard delete when relation still exist", async () => { });
        });
        describe("SAVE", () => {
            it("should unblock insert unique constraint hard delete: set null", async () => {
                const spy = vi.spyOn(db.connection, "query");

                // self reference
                const unblockSet = db.set(Unblock);
                const u1 = await unblockSet.find(10n);
                u1.unique = 0n;
                db.entry(u1).acceptChanges();
                const u2 = unblockSet.new({
                    id: u1.id + 1n,
                    unique: u1.unique,
                    name: "new"
                });
                db.delete(u1);
                const effected = await db.saveChanges({ forceHardDelete: true });

                const queries = spy.mock.calls.slice(1).flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(2);
            });
            it("should unblock insert unique constraint: set new value", async () => {
                const spy = vi.spyOn(db.connection, "query");

                // self reference
                const unblockSet = db.set(Unblock);
                const u1 = await unblockSet.find(10n);
                u1.unique = 0n;
                db.entry(u1).acceptChanges();
                const u2 = unblockSet.new({
                    id: u1.id + 1n,
                    unique: u1.unique,
                    name: "new"
                });
                db.delete(u1);
                u1.unique *= 1000n;
                const effected = await db.saveChanges();

                const queries = spy.mock.calls.slice(1).flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(2);
            });
            it("should unblock insert unique constraint: ignore", async () => {
                const spy = vi.spyOn(db.connection, "query");

                // self reference
                const unblockSet = db.set(Unblock);
                const u1 = await unblockSet.find(10n);
                u1.unique = 0n;
                db.entry(u1).acceptChanges();
                const u2 = unblockSet.new({
                    id: u1.id + 1n,
                    unique: u1.unique,
                    name: "new"
                });
                db.delete(u1);
                const effected = await db.saveChanges();

                const queries = spy.mock.calls.slice(1).flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(effected).toBe(2);
            });
        });
    });
};
