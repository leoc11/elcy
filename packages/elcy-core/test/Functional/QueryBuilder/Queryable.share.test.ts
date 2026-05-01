import { describe, it, expect, vi, beforeEach, afterEach } from "bun:test";
import { Uuid } from "../../../src/Data/Uuid";
import { DbFunction } from "../../../src/Query/DbFunction";
import { Enumerable } from "@elcy/enumerable";
import { mockContext } from "../../fixture/mock/MockContext";
import { IQuery } from "../../../src/Query/IQuery";
import { getEntityMetadata } from "../../../src/MetaData/MetaDataMapper";
import { Table1, Table1Many, Table1One, Table1Table2, Table1Table2Many, Table2, Table2Table3, Table3 } from "../../fixture";
import { ITestContext } from "../../fixture/ITestContext";
import { Temporal } from "@js-temporal/polyfill";
import { QueryableChain } from "../../../src/Queryable/Interface/QueryableChain";

const table1ManyMeta = getEntityMetadata(Table1Many);
const table1Meta = getEntityMetadata(Table1);

export const queryableTest = (db: ITestContext) => {
    mockContext(db);
    beforeEach(async () => {
        db.connection = await db.getConnection();
    });
    afterEach(() => {
        db.clear();
        vi.restoreAllMocks();
        db.closeConnection();
    });

    describe("QUERYABLE", async () => {
        describe("WITH RELATED", async () => {
            it("should eager load list navigation property", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const include = db.table1s.withRelated((o) => o.table1Manies);
                const results = await include.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results.length).toBeGreaterThan(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                    const properties = table1Meta.columns.map((o) => o.propertyName);
                    for (const property of properties) {
                        expect(o).toHaveProperty(property as any);
                        expect(o[property]).not.toBeNull();
                    }
                    expect(o.table1Manies).toBeInstanceOf(Array);
                    for (const od of o.table1Manies) {
                        expect(od).toBeInstanceOf(Table1Many);
                        const odProps = table1ManyMeta.columns.map((o) => o.propertyName);
                        for (const prop of odProps) {
                            expect(od).toHaveProperty(prop as any);
                            expect(od[prop]).not.toBeNull();
                        }
                    }
                }
            });
            it("should support nested include", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const include = db.table1s.withRelated((o) => o.table1Table2s.withRelated((o) => o.table2));
                const results = await include.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                    expect(o.table1Table2s).toBeInstanceOf(Array);
                    for (const od of o.table1Table2s) {
                        expect(od).toBeInstanceOf(Table1Table2);
                        expect(od.table2).toBeInstanceOf(Table2);
                    }
                }
            });
            it("should eager load scalar navigation property", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const include = db.table1Manies.withRelated((o) => o.table1);
                const results = await include.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1Many);
                    expect(o.table1).toBeInstanceOf(Table1);
                }
            });
            it("should eager load 2 navigation properties at once", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const include = db.table1Table2s.withRelated((o) => o.table1, (o) => o.table2);
                const results = await include.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1Table2);
                    expect(o.table1).toBeInstanceOf(Table1);
                    expect(o.table2).toBeInstanceOf(Table2);
                }
            });
        });
        describe("MAP", async () => {
            it("should return specific property", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const select = db.table1s.map((o) => o.dateTime);
                const results = await select.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Date);
                }
            });
            it("should return an object", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const select = db.table1s.map((o) => ({
                    date: o.createdDate,
                    amount: o.decimalNumber + 1.2
                }));
                const results = await select.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.date).toBeInstanceOf(Temporal.Instant);
                    expect(o.amount).toBeNumber();
                }
            });
            it("should return a value from scalar navigation property", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const select = db.table1Manies.map((o) => ({
                    date: o.table1.plainDate
                }));
                const results = await select.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.date).toBeInstanceOf(Temporal.PlainDate);
                }
            });
            it("should return an object with list navigation property", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const select = db.table1s.map((o) => ({
                    t1ms: o.table1Manies
                }));
                const results = await select.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.t1ms).toBeInstanceOf(Array);
                    for (const od of o.t1ms) {
                        expect(od).toBeInstanceOf(Table1Many);
                    }
                }
            });
            it("should return an object with scalar navigation property", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const select = db.table1s.map((o) => ({
                    t1One: o.table1One
                }));
                const results = await select.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.t1One).toBeInstanceOf(Table1One);
                }
            });
            it("should return an value from list navigation property", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const select = db.table1s.map((o) => ({
                    simpleTable1Manies: o.table1Manies.map((od) => ({
                        name: od.name
                    })).toArray()
                }));
                const results = await select.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.simpleTable1Manies).toBeInstanceOf(Array);
                    expect(o.simpleTable1Manies.length).toBeGreaterThan(0);
                    for (const od of o.simpleTable1Manies) {
                        expect(od.name).toBeString();
                    }
                }
            });
            it("should return a scalar navigation property of list navigation property", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const select = db.table1s.map((o) => ({
                    simpleT1T2s: o.table1Table2s.map((od) => ({
                        t2: od.table2
                    })).toArray()
                }));
                const results = await select.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.simpleT1T2s).toBeInstanceOf(Array);
                    expect(o.simpleT1T2s.length).toBeGreaterThan(0);
                    for (const od of o.simpleT1T2s) {
                        expect(od.t2).toBeInstanceOf(Table2);
                    }
                }
            });
            it("should support self select", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const select = db.table1s.map((o) => ({
                    simpleT1T2s: o.table1Table2s.map((od) => ({
                        t1t2: od,
                        rowVersion: od.table2.rowVersion
                    })).toArray()
                }));
                const results = await select.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.simpleT1T2s).toBeInstanceOf(Array);
                    expect(o.simpleT1T2s.length).toBeGreaterThan(0);
                    for (const od of o.simpleT1T2s) {
                        expect(od.t1t2).toBeInstanceOf(Table1Table2);
                        expect(od.rowVersion).toBeInstanceOf(Uint8Array);
                    }
                }
            });
            it("should select array", async () => {
                // TODO: cannot use group by, coz need to consider order by n paging.
                const spy = vi.spyOn(db.connection, "query");

                const select = db.table1s.map((o) => o.table1Manies); //.slice(1, 10);
                const results = await select.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Array);
                    expect(o.length).not.toBe(0);
                    for (const od of o) {
                        expect(od).toBeInstanceOf(Table1Many);
                    }
                }
            });
            it("should select array with where in property", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const select = db.table1s.map((o) => ({
                    sum: o.table1Manies.filter((p) => p.integer > 2).sum((o) => o.integer),
                    ods: o.table1Manies.filter((p) => p.integer <= 1)
                }));
                const results = await select.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.sum).toBeNumber();
                    expect(o.ods).toBeInstanceOf(Array);
                    for (const od of o.ods) {
                        expect(od).toBeInstanceOf(Table1Many);
                    }
                }

                const isAllEmpty = results.every((o) => !o.ods.some(() => true));
                expect(isAllEmpty).not.toBeTrue();
            });
            it("should work in chain", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const select = db.table1Manies.map((o) => ({
                    test: o.table1.bigint
                })).map((o) => ({
                    test3: o.test
                })).filter((o) => o.test3 > 10000);
                const results = await select.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.test3).toBe("bigint");
                }
            });
        });
        describe("FLATMAP", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const order = db.table1s.flatMap((o) => o.table1Manies);
                const results = await order.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1Many);
                }
            });
            it("select many with nested select to entity", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const order = db.table1s.flatMap((o) => o.table1Table2s.map((o) => o.table2));
                const results = await order.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table2);
                }
            });
            it("select many with nested select to related entity property", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const order = db.table1s.flatMap((o) => o.table1Table3s.map((o) => o.table3.t3Number));
                const results = await order.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeNumber();
                }
            });
            it("select many with nested select to many relation", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const order = db.table1s
                    .filter((o) => o.integer > 10000)
                    .flatMap((o) => o.table1Table2s.map((o) => o.table2.table2Table3s));
                const results = await order.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Array);
                    for (const o1 of o) {
                        expect(o1).toBeInstanceOf(Table2Table3);
                    }
                }

                const isAllEmpty = results.every((o) => !o.some(() => true));
                expect(isAllEmpty).toBeFalse();
            });
            it("should worked in chain", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const order = db.table1s.flatMap((o) => o.table1Table2s).flatMap((o) => o.table2.table2Table3s);
                const results = await order.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table2Table3);
                }
            });
            it("nested selectMany", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const order = db.table1s.flatMap((o) => o.table1Table2s.flatMap((o) => o.table2.table2Table3s));
                const results = await order.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table2Table3);
                }
            });
        });
        describe("FILTER", async () => {
            it("should add where clause", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const where = db.table1s.filter((o) => o.bigint <= 10000);
                const results = await where.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                    expect(o.bigint).toBeLessThanOrEqual(10000);
                }
            });
            it("should filter included list", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const where = db.table1s.withRelated((o) => o.table1Table2s.filter((od) => od.table2.t2Number <= 15000));
                const results = await where.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                    expect(o.table1Table2s).toBeInstanceOf(Array);
                    for (const od of o.table1Table2s) {
                        expect(od).toBeInstanceOf(Table1Table2);
                    }
                }
            });
            it("should be supported in select statement", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const where = db.table1s.map((o) => ({
                    ods: o.table1Table2s.filter((od) => od.table2.t2Number <= 15000)
                }));
                const results = await where.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o.ods).toBeInstanceOf(Array);
                    for (const od of o.ods) {
                        expect(od).toBeInstanceOf(Table1Table2);
                    }
                }
            });
            it("could be used more than once in chain", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const where = db.table1Manies
                    .filter((o) => o.table1.real <= 15000)
                    .filter((o) => DbFunction.like(o.name, "%a%"));
                const results = await where.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1Many);
                }
            });
            it("should work with groupBy", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const where = db.table1s.filter((o) => o.decimalDecimal.gt(20000))
                    .groupBy((o) => o.date)
                    .filter((o) => o.count() >= 1)
                    .map((o) => o.key)
                    .filter((o) => o.getDate() > 15).orderBy([(o) => o]);
                const results = await where.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Date);
                }
            });
            it("should filter with navigation property", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const where = db.table1table2Manies.filter((o) => o.table1table2.table1.computed > 10000);
                const results = await where.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1Table2Many);
                }
            });
        });
        describe("ORDER BY", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const order = db.table1s.orderBy([(o) => o.decimalNumber, "DESC"]);
                const results = await order.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("by related entity", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const order = db.table1Table2s.orderBy([(o) => o.table1.real, "DESC"]);
                const results = await order.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1Table2);
                }
            });
            it("by computed column", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const order = db.table1Manies.orderBy([(o) => o.integer * o.table1.integer, "DESC"]);
                const results = await order.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1Many);
                }
            });
            it("should be ordered by multiple column", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const order = db.table1Ones.orderBy([(o) => o.name], [(o) => o.table1.decimalDecimal, "DESC"]);
                const results = await order.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1One);
                }
            });
            it("should used last defined order", async () => {
                const spy = vi.spyOn(db.connection, "query");

                // Note: thought Product no longer used, it still exist in join statement.
                const order = db.table1Manies.orderBy([(o) => o.table1.computed, "DESC"]).orderBy([(o) => o.integer]);
                const results = await order.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1Many);
                }
            });
            it("could be used in include", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const order = db.table1s.withRelated((o) => o.table1Table2s.orderBy([(od) => od.table2.t2Name, "DESC"]));
                const results = await order.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                    expect(o.table1Table2s).toBeInstanceOf(Array);
                    expect(o.table1Table2s.length).toBeGreaterThan(0);
                    for (const od of o.table1Table2s) {
                        expect(od).toBeInstanceOf(Table1Table2);
                    }
                }
            });
            it("could be used in select", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const order = db.table1s.map((o) => ({
                    ods: o.table1Table2s.orderBy([(o) => o.table2.t2Number]).toArray()
                }));
                const results = await order.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o.ods).toBeInstanceOf(Array);
                    expect(o.ods.length).toBeGreaterThan(0);
                    for (const od of o.ods) {
                        expect(od).toBeInstanceOf(Table1Table2);
                    }
                }
            });
        });
        describe("SOME", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const result = await db.table1s.some();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(result).toBe(true);
            });
            it("could be used in select", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const any = db.table1s.map((o) => ({
                    order: o,
                    hasDetail: o.table1Table2s.some((od) => od.table2.t2Number < 20000)
                }));
                const results = await any.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.order).toBeInstanceOf(Table1);
                    expect(typeof o.hasDetail).toBe("boolean");
                }
            });
            it("could be used in where", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const any = db.table1s.filter((o) => o.table1Manies.some());
                const results = await any.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
        });
        describe("EVERY", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const result = await db.table1s.every((o) => o.real <= 20000);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(result).toBe(false);
            });
            it("could be used in select", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const all = db.table1s.map((o) => ({
                    order: o,
                    hasDetail: o.table1Table2s.every((od) => od.table2.t2Number < 20000)
                }));
                const results = await all.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.order).toBeInstanceOf(Table1);
                    expect(typeof o.hasDetail).toBe("boolean");
                }
            });
            it("could be used in where", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const all = db.table1s.filter((o) => o.table1Table3s.every((od) => od.table3.t3Number <= 20000));
                const results = await all.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
        });
        describe("MAX", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const result = await db.table1s.max((o) => o.decimalNumber);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();
                expect(typeof result).toBe("number");
            });
            it("could be used in select", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const max = db.table1s.map((o) => ({
                    order: o,
                    max: o.table1Table2s.max((od) => od.table2.t2Number)
                }));
                const results = await max.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.order).toBeInstanceOf(Table1);
                    expect(typeof o.max).toBe("number");
                }
            });
            it("could be used in where", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const max = db.table1s.filter((o) => o.table1Table2s.max((od) => od.table2.t2Number) > 20000);
                const results = await max.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
        });
        describe("MIN", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const result = await db.table1s.min((o) => o.real);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(typeof result).toBe("number");
            });
            it("could be used in select", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const min = db.table1s.map((o) => ({
                    order: o,
                    min: o.table1Table2s.min((od) => od.table2.t2Number)
                }));
                const results = await min.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.order).toBeInstanceOf(Table1);
                    expect(typeof o.min).toBe("number");
                }
            });
            it("could be used in where", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const min = db.table1s.filter((o) => o.table1Table2s.min((od) => od.table2.t2Number) > 20000);
                const results = await min.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
        });
        describe("AVG", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const result = await db.table1s.avg((o) => o.integer);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(typeof result).toBe("number");
            });
            it("could be used in select", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const avg = db.table1s.map((o) => ({
                    order: o,
                    avg: o.table1Table2s.avg((od) => od.table2.t2Number)
                }));
                const results = await avg.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o.order).toBeInstanceOf(Table1);
                    expect(o.avg).toBeNumber();
                }
            });
            it("could be used in where", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const avg = db.table1s.filter((o) => o.table1Table2s.avg((od) => od.table2.t2Number) > 20000);
                const results = await avg.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
        });
        describe("SUM", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const result = await db.table1s.sum((o) => o.computed);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(typeof result).toBe("number");
            });
            it("could be used in select", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const sum = db.table1s.map((o) => ({
                    order: o,
                    sum: o.table1Table2s.sum((od) => od.table2.t2Number * od.table1.computed)
                }));
                const results = await sum.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o.order).toBeInstanceOf(Table1);
                    expect(o.sum).toBeNumber();
                }
            });
            it("could be used in where", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const sum = db.table1s.filter((o) => o.table1Table2s.sum((od) => od.table1Table2One.number) > 3);
                const results = await sum.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
        });
        describe("COUNT", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const count = db.table1Table2s.filter((o) => o.table1Table2Manies.sum((od) => od.number) > 3);
                const result = await count.count();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(typeof result).toBe("number");
            });
            it("could be used in select", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const count = db.table1s.map((o) => ({
                    order: o,
                    count: o.table1Manies.count()
                }));
                const results = await count.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o.order).toBeInstanceOf(Table1);
                    expect(o.count).toBeNumber();
                }
            });
            it("could be used in where", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const count = db.table1s.filter((o) => o.table1Manies.count() > 3);
                const results = await count.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("could be used in select with different filter", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const count = db.table1s.groupBy((o) => ({ month: o.plainDate.month })).map((o) => ({
                    qty: o.flatMap((o) => o.table1Manies).map((o) => o.integer).sum(),
                    bc: o.filter((o) => o.bigint > 20000).count(),
                    cd: o.filter((o) => o.real <= 20000).count()
                }));
                const results = await count.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                for (const o of results) {
                    expect(typeof o.qty).toBe("number");
                    expect(typeof o.bc).toBe("number");
                    expect(typeof o.cd).toBe("number");
                }
            });
        });
        describe("SLICE", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const take = db.table1s.slice(10, 14).slice(0, 2).slice(1);
                const results = await take.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBe(1);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("order.take.order.take", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const take = db.table1s.orderBy([(o) => o.plainDate, "DESC"]).slice(0, 10)
                    .orderBy([(o) => o.modifiedDate, "DESC"]).slice(0, 5);
                const results = await take.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should work in include", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const take = db.table1s.withRelated((o) => o.table1Manies.orderBy([(o) => o.integer]).slice(1, 10).slice(0, 2).slice(1));
                const results = await take.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                const any = results.some((o) => o.table1Manies.length > 1);
                expect(typeof any).toBe("boolean");
                expect(any).toBe(false);
            });
            it("should work in include 2 (consider orderBy after take)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const take = db.table1s.
                    withRelated((o) => o.table1Manies
                        .orderBy([(o) => o.integer, "DESC"])
                        .slice(0, 5).slice(1)
                        .orderBy([(o) => o.name])
                        .slice(0, 3)
                    ).slice(0, 10);
                const results = await take.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBeGreaterThan(0);;
                const any = results.some((o) => o.table1Manies.length > 3);
                expect(typeof any).toBe("boolean");
                expect(any).toBe(false);
            });
        });
        describe("FIND", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const result = await db.table1s.find();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(result).toBeInstanceOf(Table1);
                expect(db.table1s.local.count()).toBe(1);
            });
            it("should work with where", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const now = Temporal.Instant.from('2026-01-01T00:00:00Z');
                const result = await db.table1s
                    .parameter({ now })
                    .filter((o) => o.instant < now)
                    .find((o) => o.integer > 20000);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(result).toBeInstanceOf(Table1);
                expect(db.table1s.local.count()).toBe(1);
            });
            it("should work with select", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const first = db.table1s.map((o) => ({
                    order: o,
                    find: o.table1Manies.orderBy([(o) => o.integer, "DESC"]).find()
                }));
                const results = await first.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.order).toBeInstanceOf(Table1);
                    expect(o.find).toBeInstanceOf(Table1Many);
                }
            });
        });
        describe("DISTINCT", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const distinct = db.table1s.map((o) => o.decimalNumber).distinct();
                const results = await distinct.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o).toBe("number");
                }
                expect(results.length).toBe(new Set(results).size);
            });
            it("should work with select", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const distinct = db.table1s.map((o) => ({
                    order: o,
                    distincts: o.table1Manies.map((p) => p.integer).distinct().toArray()
                }));
                const results = await distinct.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.order).toBeInstanceOf(Table1);
                    expect(o.distincts).toBeInstanceOf(Array);
                    expect(o.distincts.length).toBeGreaterThan(0);
                    for (const od of o.distincts) {
                        expect(typeof od).toBe("number");
                    }
                    expect(o.distincts.length).toBe(new Set(o.distincts).size);
                }
            });
        });
        describe("GROUP BY", async () => {
            it("groupBy.(o => o.column).map(o => o.key)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => o.dateTime).map((o) => o.key);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Date);
                }
            });
            it("groupBy.(o => o.column).map(o => o.key.method())", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => o.date).map((o) => o.key.getDate());
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o).toBe("number");
                }
            });
            it("groupBy.(o => o.column).map(o => o.count())", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => o.dateTime).map((o) => o.count());
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o).toBe("number");
                }
            });
            it("groupBy.(o => o.column + o.column).map(o => o.key)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => o.dateTime.getDate() + o.dateTime.getFullYear()).map((o) => o.key);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o).toBe("number");
                }
            });
            it("groupBy.(o => o.column + o.column).map(o => {column: o.key, count: o.count(), sum: o.sum()})", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => o.dateTime.getDate() + o.dateTime.getFullYear()).map((o) => ({
                    dateYear: o.key,
                    count: o.count(),
                    sum: o.filter((o) => o.integer < 10000).sum((o) => o.decimalNumber)
                }));
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.dateYear).toBe("number");
                    expect(typeof o.count).toBe("number")
                    expect(o.count).toBeGreaterThan(0);
                    expect(typeof o.sum).toBe("number");
                }
            });
            it("groupBy computed column", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => o.computed);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.key).toBe("number");
                    for (const od of o) {
                        expect(od).toBeInstanceOf(Table1);
                    }
                }
            });
            it("groupBy computed column complex 1", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.slice(0, 100).filter((o) => o.computed > 10000)
                    .map((o) => o.table1One)
                    .groupBy((o) => o.name.length)
                    .map((o) => ({
                        len: o.key,
                        count: o.count(),
                        sum: o.filter((o) => o.table1.real < 10000).sum((o) => o.table1.real)
                    }));
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.len).toBe("number");
                    expect(typeof o.count).toBe("number");
                    expect(o.count).toBeGreaterThan(0);
                    expect(typeof o.sum).toBe("number");
                }
            });
            it("groupBy.(o => o.column.method()).map(o => o.toArray())", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => o.dateTime.getDate()).map((o) => o.toArray());
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Array);
                    for (const od of o) {
                        expect(od).toBeInstanceOf(Table1);
                    }
                }
            });
            it("groupBy.(o => o.column.method()).map(o => ({items: o}))", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => o.plainDate.day).map((o) => ({
                    details: o.toArray()
                }));
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    if (!o.details) {
                        debugger;
                    }
                    expect(o.details).toBeInstanceOf(Array);
                    for (const od of o.details) {
                        expect(od).toBeInstanceOf(Table1);
                    }
                }
            });
            it("groupBy.(o => o.toOneRelation).map(o => o.key)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1Manies.filter((o) => o.integer > 1).groupBy((o) => o.table1).map((o) => o.key);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("groupBy.(o => o.toOneRelation).map(o => o.key.column.method())", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1Table2s.groupBy((o) => o.table1).map((o) => o.key.date.getDate());
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o).toBe("number");
                }
            });
            it("groupBy.(o => o.toOneRelation).map(o => o.count())", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1Manies.groupBy((o) => o.table1).map((o) => o.count());
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o).toBe("number");
                }
            });
            it("groupBy.(o => o.toOneRelation.toOneRelation).map(o => o.key.column)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1table2Ones.groupBy((o) => o.table1table2.table1).map((o) => o.key.dateTime);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Date);
                }
            });
            it("groupBy.(o => o.toOneRelation).map(o => {col: o.key, count: o.count(), sum: o.filter().sum()})", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1Manies.groupBy((o) => o.table1).map((o) => ({
                    order: o.key,
                    count: o.count(),
                    sum: o.filter((o) => o.integer > 1).sum((o) => o.integer)
                }));
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.order).toBeInstanceOf(Table1);
                    expect(typeof o.count).toBe("number");
                    expect(typeof o.sum).toBe("number");
                }
            });
            it("groupBy(o => ({obj: {prop: o.col} })).map(o => o.key)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => ({
                    obj: {
                        pid: o.identifier
                    },
                    Quantity: o.decimalNumber * 2
                })).map((o) => o.key);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.obj).toBeInstanceOf(Object);
                    expect(o.obj.pid).toBeInstanceOf(Uuid);
                    expect(typeof o.Quantity).toBe("number");
                }
            });
            it("groupBy(o => ({obj: {prop: o.col} })).map(o => o.key.obj)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => ({
                    obj: {
                        pid: o.identifier
                    },
                    Quantity: o.integer * 2
                })).map((o) => o.key.obj);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.pid).toBeInstanceOf(Uuid);
                }
            });
            it("groupBy(o => ({obj: {prop: o.col} })).map(o => o.key.obj.prop)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => ({
                    obj: {
                        pid: o.identifier
                    },
                    Quantity: o.integer * 2
                })).map((o) => o.key.obj.pid);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Uuid);
                }
            });
            it("groupBy(o => o.toOneRelation.toOneRelation).map(o => {col: o.key, count: o.count(), sum: o.filter().sum()})", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1table2Ones.groupBy((o) => o.table1table2.table1).map((o) => ({
                    order: o.key,
                    count: o.count(),
                    sum: o.filter((o) => o.number < 20000).sum((o) => o.number)
                }));
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.order).toBeInstanceOf(Table1);
                    expect(typeof o.count).toBe("number");
                    expect(typeof o.sum).toBe("number");
                }
            });
            it("groupBy(o => o.toOneRelation).map(o => o.key.toOneRelation)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1table2Manies.groupBy((o) => o.table1table2).map((o) => o.key.table1);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("groupBy(o => ({col: o.column, col: o.column*2 })).map(o => o.key)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => ({
                    productid: o.identifier,
                    Quantity: o.integer * 2
                })).map((o) => o.key);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.productid).toBeInstanceOf(Uuid);
                    expect(typeof o.Quantity).toBe("number");
                }
            });
            it("groupBy(o => ({col: o.column, col: o.column*2 })).map(o => o.count())", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => ({
                    productid: o.identifier,
                    Quantity: o.integer * 2
                })).map((o) => o.count());
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o).toBe("number");
                }
            });
            it("groupBy(o => ({col: o.column, col: o.column*2 })).map(o => o.key.col)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => ({
                    productid: o.identifier,
                    Quantity: o.integer * 2
                })).map((o) => o.key.Quantity);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o).toBe("number");
                }
            });
            it("groupBy(o => ({col: o.column, col: o.column*2 })).map(o => ({ col: { col: col }}))", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.groupBy((o) => ({
                    productid: o.identifier,
                    Quantity: o.integer * 2
                })).map((o) => ({
                    data: {
                        pid: o.key.productid,
                        qty: o.key.Quantity,
                        avg: o.avg((o) => o.integer)
                    },
                    count: o.count(),
                    sum: o.filter((o) => o.integer > 1).sum((o) => o.integer)
                }));
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.count).toBe("number");
                    expect(typeof o.sum).toBe("number");
                    expect(o.data).toBeObject();
                    expect(o.data).toHaveProperty("pid");
                    expect(o.data).toHaveProperty("qty");
                    expect(o.data).toHaveProperty("avg");
                }
            });
            it("groupBy(o => ({col: o.toOneRelation.column.method(), col: o.toOneRelation.column })).map(o => ({ col: { col: col }}))", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1Table2s.groupBy((o) => ({
                    date: o.table1.dateTime.getDate(),
                    price: o.table2.t2Number
                })).map((o) => ({
                    data: {
                        day: o.key.date,
                        price: o.key.price,
                        avg: o.avg((o) => o.table1Table2One.number)
                    },
                    count: o.count(),
                    sum: o.filter((o) => o.table1Table2One.number > 1).sum((o) => o.table1Table2One.number)
                }));
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.count).toBe("number");
                    expect(typeof o.sum).toBe("number");
                    expect(o.data).toBeObject();
                    expect(o.data).toHaveProperty("day");
                    expect(o.data).toHaveProperty("price");
                    expect(o.data).toHaveProperty("avg");
                }
            });
            it("groupBy.(o => ({col: o.toOneRelation })).map(o => o.key).map(o => o.col.name)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1table2Manies.groupBy((o) => ({
                    od: o.table1table2
                })).map((o) => o.key).map((o) => o.od.option12);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o).toBe("string");
                }
            });
            it("groupBy.(o => o.column.method())", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1s.filter((o) => o.decimalNumber > 20000).groupBy((o) => o.dateTime.getDate())
                    .filter((o) => o.count() > 3);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Array);
                    expect(typeof o.key).toBe("number");
                    for (const od of o) {
                        expect(od).toBeInstanceOf(Table1);
                    }
                }
            });
            it("groupBy.(o => o.toOneRelation.toOneRelation)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1table2Manies.groupBy((o) => o.table1table2.table1);
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(Array.isArray(o)).toBe(true);
                    expect(o.key).toBeInstanceOf(Table1);
                    for (const od of o) {
                        expect(od).toBeInstanceOf(Table1Table2Many);
                    }
                }
            });
            it("groupBy.(o => ({col: o.toOneRelation.column.method(), col: o.toOneRelation.column }))", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1Table2s.groupBy((o) => ({
                    date: o.table1.dateTime.getDate(),
                    price: o.table2.t2Number
                }));
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Array);
                    expect(typeof o.key.price).toBe("number");
                    for (const od of o) {
                        expect(od).toBeInstanceOf(Table1Table2);
                    }
                }
            });
            it("groupBy(o => ({obj: {prop: o.col} }))", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table3s.groupBy((o) => ({
                    obj: {
                        pid: o.id
                    },
                    Quantity: o.t3Number * 2
                }));
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.key).toBeInstanceOf(Object);
                    expect(o.key.obj).toBeInstanceOf(Object);
                    expect(o.key.obj.pid).toBeInstanceOf(Uuid);
                    expect(typeof o.key.Quantity).toBe("number");
                    for (const od of o) {
                        expect(od).toBeInstanceOf(Table3);
                    }
                }
            });
            it("groupBy.(o => ({col: o.toOneRelation }))", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const groupBy = db.table1Table2s.groupBy((o) => ({
                    od: o.table1
                }));
                const results = await groupBy.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Array);
                    expect(o.key.od).toBeInstanceOf(Table1);
                    for (const od of o) {
                        expect(od).toBeInstanceOf(Table1Table2);
                    }
                }
            });
        });
        describe("TOMAP", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const results = await db.table1s.toMap((o) => o.id, (o) => o.dateTime);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Map);
                expect(results.size).toBeGreaterThan(0);
                for (const [key, value] of results) {
                    expect(typeof key).toBe("bigint");
                    expect(value).toBeInstanceOf(Date);
                }
            });
            it("should support self select and keep defined includes", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const results = await db.table1s.withRelated((o) => o.table1Manies).toMap((o) => o.id);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Map);
                expect(results.size).toBeGreaterThan(0);
                for (const [key, value] of results) {
                    expect(typeof key).toBe("bigint");
                    expect(value).toBeInstanceOf(Table1);
                    for (const o of value.table1Manies) {
                        expect(o).toBeInstanceOf(Table1Many);
                    }
                }
            });
        });
        describe("TOSET", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const results = await db.table1s.toSet();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Set);
                expect(results.size).toBeGreaterThan(0);
                for (const value of results) {
                    expect(value).toBeInstanceOf(Table1);
                }
            });
        });
        describe("JOIN", async () => {
            it("should support inner join", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const join = db.table1Manies.innerJoin(db.table1s, (o1, o2) => o1.table1Id === o2.id, (o1, o2) => ({
                    quantity: o2.integer,
                    name: o2.table1One.name,
                    price: o1.integer,
                    date: o2.dateTime
                })).filter((o) => o.quantity > 1);
                const results = await join.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.quantity).toBe("number");
                    expect(typeof o.name).toBe("string");
                    expect(typeof o.price).toBe("number");
                    expect(o.date).toBeInstanceOf(Date);
                }
            });
            it("should support left join", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const join = db.table2s.leftJoin(db.table1Table2s, (o1, o2) => o1.id === o2.table2Id, (o1, o2) => ({
                    quantity: o1.t2Number,
                    name: o2.option12,
                    price: o2.table1.decimalNumber,
                    date: o2.table1.date,
                    propertyNames: o2.table1Table2Manies.map((o) => o.string).toArray()
                })).filter((o) => o.quantity > 1);
                const results = await join.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.quantity).toBe("number");
                    expect(typeof o.name).toBe("string");
                    expect(typeof o.price).toBe("number");
                    expect(o.date).toBeInstanceOf(Date);
                    expect(o.propertyNames).toBeInstanceOf(Array);
                    for (const o2 of o.propertyNames) {
                        expect(typeof o2).toBe("string");
                    }
                }
            });
            it("should support right join", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const join = db.table3s.rightJoin(db.table1Table3s, (o1, o2) => o1.id === o2.table3Id, (o1, o2) => ({
                    quantity: o2.table1.integer,
                    name: o2.option13,
                    price: o1.t3Number,
                    date: o2.table1.dateTime
                })).filter((o) => o.quantity > 1);
                const results = await join.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.quantity).toBe("number");
                    expect(typeof o.name).toBe("string");
                    expect(typeof o.price).toBe("number");
                    expect(o.date).toBeInstanceOf(Date);
                }
            });
            it("should support full join", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const join = db.table3s.fullJoin(db.table1Table3s, (o1, o2) => o1.id === o2.table3Id, (o1, o2) => ({
                    quantity: o2.table1.integer,
                    name: o2.option13,
                    price: o1.t3Number,
                    date: o2.table1.dateTime
                })).filter((o) => o.quantity > 1);
                const results = await join.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.quantity).toBe("number");
                    expect(typeof o.name).toBe("string");
                    expect(typeof o.price).toBe("number");
                    expect(o.date).toBeInstanceOf(Date);
                }
            });
            it("should support group join", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const join = db.table1s.groupJoin(db.table1Table2s, (o1, o2) => o1.id === o2.table1Id, (o1, o2) => ({
                    quantity: o2.sum(o => o.table1.integer),
                    names: o2.map(o => o.option12).toArray(),
                    price: o2.sum(o => o.table2.t2Number),
                    date: o1.dateTime
                })).filter((o) => o.quantity > 1);
                const results = await join.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.quantity).toBe("number");
                    expect(typeof o.price).toBe("number");
                    expect(o.date).toBeInstanceOf(Date);
                    expect(o.names).toBeInstanceOf(Array);
                    for (const n of o.names) {
                        expect(typeof n).toBe("string");
                    }
                }
            });
            it("should support cross join", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const join = db.table3s.crossJoin(db.table1Table3s, (o1, o2) => ({
                    quantity: o2.table1.integer,
                    name: o2.option13,
                    price: o1.t3Number,
                    date: o2.table1.dateTime
                })).filter((o) => o.quantity > 1);
                const results = await join.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.quantity).toBe("number");
                    expect(typeof o.name).toBe("string");
                    expect(typeof o.price).toBe("number");
                    expect(o.date).toBeInstanceOf(Date);
                }
            });
        });
        describe("SET OPERATOR", async () => {
            it("should union 2 records", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const greatest = db.table1s.orderBy([(o) => o.decimalNumber, "DESC"]).slice(0, 5);
                const worst = db.table1s.orderBy([(o) => o.decimalNumber, "ASC"]).slice(0, 5);
                const join = greatest.union(worst).filter((o) => o.table1Manies.count() > 1);
                const results = await join.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should concat 2 records", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const greatest = db.table1s.orderBy([(o) => o.decimalNumber, "DESC"]).slice(0, 5);
                const worst = db.table1s.orderBy([(o) => o.decimalNumber, "ASC"]).slice(0, 5);
                const join = greatest.concat(worst).filter((o) => o.table1Manies.count() > 1);
                const results = await join.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should intersect 2 records", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const greatest = db.table1s.orderBy([(o) => o.decimalNumber, "DESC"]).slice(0, 10);
                const worst = db.table1s.orderBy([(o) => o.decimalNumber, "ASC"]).slice(0, 10);
                const join = greatest.intersect(worst).slice(0, 5);
                const results = await join.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should except records", async () => {
                const spy = vi.spyOn(db.connection, "query");
                const greatest = db.table1s.orderBy([(o) => o.decimalNumber, "DESC"]).slice(0, 10);
                const worst = db.table1s.orderBy([(o) => o.decimalNumber, "ASC"]).slice(0, 5);
                const join = greatest.except(worst).orderBy([(o) => o.decimalNumber, "DESC"]);
                const results = await join.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
        });
        describe("PIVOT", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const pivot = db.table1s.pivot(
                    {
                        month: (o) => o.dateTime.getMonth()
                    },
                    {
                        total: (o) => Enumerable.from(o).sum((o) => o.decimalNumber),
                        qty: (o) => Enumerable.from(o).flatMap((o) => o.table1Manies).map((o) => o.integer).sum()
                    });
                const results = await pivot.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.month).toBe("number");
                    expect(typeof o.total).toBe("number");
                    expect(typeof o.qty).toBe("number");
                }
            });
            it("support where", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const pivot = db.table1s.pivot(
                    {
                        month: (o) => o.dateTime.getMonth()
                    }, {
                    total: (o) => o.sum((o) => o.decimalNumber),
                    qty: (o) => o.flatMap((o) => o.table1Manies).map((o) => o.integer).sum()
                }).filter((o) => o.month >= 10);
                const results = await pivot.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.month).toBe("number");
                    expect(typeof o.total).toBe("number");
                    expect(typeof o.qty).toBe("number");
                }
            });
        });
        describe("PARAMETERS", async () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const paramObj = { now: (new Date(1767200400000)) };
                const parameter = db.table1s.parameter({ paramObj }).filter((o) => o.dateTime < paramObj.now);
                const results = await parameter.toArray();

                expect(spy).toHaveBeenCalledTimes(1);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should be computed in application", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const paramObj = { now: new Date(1767200400000) };
                const parameter = db.table1s.parameter({ paramObj }).filter((o) => o.dateTime.getDate() !== paramObj.now.getDate());
                const results = await parameter.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(spy).toHaveBeenCalledTimes(1);
                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should be computed in query", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const parameter = db.table1s.filter((o) => o.dateTime < new Date());
                const results = await parameter.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should pass function to query", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const fn = (o: QueryableChain<Table1>) => o.integer / o.table1Manies.count();
                const parameter = db.table1s.parameter({ fn }).map((o) => fn(o));
                const results = await parameter.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o).toBe("number");
                }
            });
            it("should pass function with parameter", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const multi = 10;
                const fn = (o: QueryableChain<Table1>) => o.real * multi / o.table1Manies.count();
                const parameter = db.table1s.parameter({ fn, multi }).map((o) => fn(o));
                const results = await parameter.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(spy).toHaveBeenCalledTimes(1);
                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o).toBe("number");
                }
            });
            it("should re-build query based on Function type parameter", async () => {
                for (let i = 0; i < 2; i++) {
                    const fn = i % 2 === 0 ? (o: number) => o + 1 : (o: number) => o - 1;
                    const where = db.table1s.parameter({ fn })
                        .map((o) => fn(o.decimalNumber));
                    db.connection = await db.getConnection();
                    const spy = vi.spyOn(db.connection, "query");

                    await where.toArray();
                    if (i % 2 === 0) {
                        const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                        expect(queries).toMatchSnapshot();
                    }
                    else {
                        const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                        expect(queries).toMatchSnapshot();
                    }
                }
            });
            it("should support null value parameter", async () => {
                let spy = vi.spyOn(db.connection, "query");

                let dd = new Date(1767200400000);
                let avg = db.table1s.parameter({ dd }).filter((o) => o.dateTime === dd);
                let results = await avg.toArray();

                let queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(spy).toHaveBeenCalledTimes(1);
                expect(results).toBeInstanceOf(Array);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }

                spy.mockRestore();
                db.connection = await db.getConnection();
                spy = vi.spyOn(db.connection, "query");

                dd = null;
                avg = db.table1s.parameter({ dd }).filter((o) => o.dateTime === dd);
                results = await avg.toArray();

                queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(spy).toHaveBeenCalledTimes(1);
                expect(results).toBeInstanceOf(Array);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should be used in withRelated", async () => {
                const spy = vi.spyOn(db.connection, "query");

                let skip1 = 5;
                let take1 = 10;
                let take2 = 10;
                let filter1 = 100;
                let filter2 = 2000;
                const include = db.table1s
                    .parameter({ skip1, take1, take2, filter1, filter2 })
                    .withRelated(o => o.table1Table2s.slice(skip1, take1), (o) => o.table1Manies.slice(0, take2).filter(o => o.integer > filter1))
                    .filter(o => o.decimalNumber < filter2);
                const results = await include.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results.length).toBeGreaterThan(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                    const properties = table1Meta.columns.map((o) => o.propertyName);
                    for (const property of properties) {
                        expect(o).toHaveProperty(property as any);
                        expect(o[property]).not.toBeNull();
                    }
                    expect(o.table1Table2s).toBeInstanceOf(Array);
                    for (const od of o.table1Table2s) {
                        expect(od).toBeInstanceOf(Table1Table2);
                    }
                    expect(o.table1Manies).toBeInstanceOf(Array);
                    for (const od of o.table1Manies) {
                        expect(od).toBeInstanceOf(Table1Many);
                        const odProps = table1ManyMeta.columns.map((o) => o.propertyName);
                        for (const prop of odProps) {
                            expect(od).toHaveProperty(prop as any);
                            expect(od[prop]).not.toBeNull();
                        }
                    }
                }
            });
            it("1 parameter multi location", async () => {
                const spy = vi.spyOn(db.connection, "query");

                let param = 10;
                const parameter = db.table1s.parameter({ param })
                    .filter((o) => o.integer < param && o.decimalNumber > param && o.real != param);
                const results = await parameter.toArray();

                expect(spy).toHaveBeenCalledTimes(1);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("1 parameter multi sql param", async () => {
                const spy = vi.spyOn(db.connection, "query");

                let param = 10;
                const parameter = db.table1s.parameter({ param })
                    .filter((o) => o.integer < param && o.decimalNumber > param + 20 && o.real != param % 3 + 3);
                const results = await parameter.toArray();

                expect(spy).toHaveBeenCalledTimes(1);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("1 parameter multi sql param + keep", async () => {
                const spy = vi.spyOn(db.connection, "query");

                let param = 10;
                const parameter = db.table1s.parameter({ param })
                    .filter((o) => o.integer < param && o.decimalNumber > param && o.real != param % 3 + 3);
                const results = await parameter.toArray();

                expect(spy).toHaveBeenCalledTimes(1);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should work as return value", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const paramObj = { now: (new Date(1767200400000)) };
                const parameter = db.table1s.parameter({ paramObj }).map(o => paramObj.now);
                const results = await parameter.toArray();

                expect(spy).toHaveBeenCalledTimes(1);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Date);
                }
            });
        });
        describe("SUBQUERY", () => {
            it("should work in where (CONTAINS)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1Manies.filter((o) => o.integer > 5).asSubquery();
                const subQuery = db.table1s.parameter({ ad }).filter((o) => ad.map((od) => od.table1Id).includes(o.id));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should work in where (Aggregate comparation)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1Manies.filter((o) => o.integer > 5).asSubquery();
                const subQuery = db.table1s.parameter({ ad }).filter((o) => ad.filter((od) => od.table1Id === o.id).max((o) => o.integer) > 10);
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should work in where (ANY)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1Manies.filter((o) => o.integer > 5).asSubquery();
                const subQuery = db.table1s.parameter({ ad }).filter((o) => ad.some((od) => od.table1Id === o.id));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should determine whether where filter goes to join expression or not", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1Manies.asSubquery();
                const subQuery = db.table1s.parameter({ ad }).filter((o) => ad.filter((od) => od.integer > 1 && od.table1Id === o.id).count() > 1);
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should work in select (Relation/Array)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1Manies.asSubquery();
                const subQuery = db.table1s.parameter({ ad }).filter((o) => o.decimalNumber <= 20000).map((o) => ({
                    subs: ad.filter((od) => od.table1Id === o.id).toArray()
                }));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o.subs).toBeInstanceOf(Array);
                    expect(o.subs.length).toBeGreaterThan(0);
                    for (const od of o.subs) {
                        expect(od).toBeInstanceOf(Table1Many);
                    }
                }
            });
            it("should work in select (Aggregate)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1Manies.asSubquery();
                const subQuery = db.table1s.parameter({ ad }).filter((o) => o.decimalNumber <= 20000).map((o) => ({
                    subs: ad.filter((od) => od.table1Id === o.id).count()
                }));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.subs).toBe("number");
                }
            });
            it("should work in select (Count SubQuery)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1s.orderBy([(o) => o.integer, "ASC"]);
                const ads = ad.asSubquery();
                const subQuery = ad.parameter({ ads }).map((o) => ({
                    TotalAmount: o.integer,
                    Count: ads.filter((od) => o.integer >= od.integer).count()
                }));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.TotalAmount).toBe("number");
                    expect(typeof o.Count).toBe("number");
                }
            });
            it("should work in select (Sum SubQuery)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1s.orderBy([(o) => o.dateTime, "DESC"]);
                const ads = ad.asSubquery();
                const subQuery = ad.slice(0, 10).parameter({ ads }).map((o) => ({
                    OrderId: o.identifier,
                    TotalAmount: o.decimalNumber,
                    Accumulated: ads.filter((od) => od.dateTime >= o.dateTime).sum((o) => o.decimalNumber)
                }));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(spy).toHaveBeenCalledTimes(1);
                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.TotalAmount).toBe("number");
                    expect(typeof o.Accumulated).toBe("number");
                    expect(o.OrderId).toBeInstanceOf(Uuid);
                }
            });
            it("should work in select (Some SubQuery)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1s.orderBy([(o) => o.decimalNumber, "ASC"]);
                const ads = ad.asSubquery();
                const subQuery = ad.slice(0, 10).parameter({ ads }).map((o) => ({
                    TotalAmount: o.decimalNumber,
                    IsNotLowest: ads.filter((od) => o.decimalNumber > od.decimalNumber).some()
                }));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(spy).toHaveBeenCalledTimes(1);
                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.TotalAmount).toBe("number");
                    expect(typeof o.IsNotLowest).toBe("boolean");
                }
            });
            it("should work in select (Every SubQuery)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1s.orderBy([(o) => o.decimalNumber, "DESC"]);
                const ads = ad.asSubquery();
                const subQuery = ad.slice(0, 10).parameter({ ads }).map((o) => ({
                    TotalAmount: o.decimalNumber,
                    IsHighest: ads.every((od) => o.decimalNumber >= od.decimalNumber)
                }));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(spy).toHaveBeenCalledTimes(1);
                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.TotalAmount).toBe("number");
                    expect(typeof o.IsHighest).toBe("boolean");
                }
            });
        });
        describe("ARRAY PARAMETER", () => {
            it("should work in where (CONTAINS)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad: Table1Many[] = [
                    Object.assign(new Table1Many(), { table1Id: 10n })
                ];
                // specify item type in case array did not have any item.
                const subQuery = db.table1s.parameter({
                    ad, ad_itemtype: {
                        constructor: Table1Many,
                        table1Id: BigInt
                    }
                }).filter((o) => ad.map((od) => od.table1Id).includes(o.id));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should work in where (Aggregate comparation)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad: Table1Many[] = [
                    Object.assign(new Table1Many(), { table1Id: 1234567890n, integer: 11 })
                ];
                const subQuery = db.table1s.parameter({ ad }).filter((o) => Enumerable.from(ad).filter((od) => od.table1Id === o.id).max((o) => o.integer) > 10);
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should work in where (Some)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = Enumerable.from([
                    Object.assign(new Table1Many(), { table1Id: 1234567890n, integer: 11 })
                ]);
                const subQuery = db.table1s.parameter({ ad }).filter((o) => ad.some((od) => od.table1Id === o.id));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should determine whether where filter goes to join expression or not", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = Enumerable.from([
                    Object.assign(new Table1Many(), { table1Id: 1234567890n, integer: 11 })
                ]);
                const subQuery = db.table1s.parameter({ ad }).filter((o) => ad.filter((od) => od.integer > 1 && od.table1Id === o.id).count() > 1);
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should work in select (Relation/Array)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = Enumerable.from([
                    Object.assign(new Table1Many(), { table1Id: 1234567890n, integer: 11 })
                ]);
                const subQuery = db.table1s.parameter({ ad }).filter((o) => o.decimalNumber <= 20000).map((o) => ({
                    subs: ad.filter((od) => od.table1Id === o.id)
                }));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                for (const o of results) {
                    expect(o.subs).toBeInstanceOf(Array);
                    for (const od of o.subs) {
                        expect(od).toBeInstanceOf(Table1Many);
                    }
                }
            });
            it("should work in select (Aggregate)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = Enumerable.from([
                    Object.assign(new Table1Many(), { table1Id: 1234567890n, integer: 11 })
                ]);
                const subQuery = db.table1s.parameter({ ad }).filter((o) => o.decimalNumber <= 20000).map((o) => ({
                    subs: ad.filter((od) => od.table1Id === o.id).count()
                }));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.subs).toBe("number");
                }
            });
            it("should work in select (Count SubQuery)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1s.orderBy([(o) => o.decimalNumber, "ASC"]);
                const ads = Enumerable.from([
                    Object.assign(new Table1(), { id: 1234567890n, decimalNumber: 13200 }),
                    Object.assign(new Table1(), { id: 1234567891n, decimalNumber: 71000 }),
                ]);
                const subQuery = ad.parameter({ ads }).map((o) => ({
                    TotalAmount: o.decimalNumber,
                    Count: ads.filter((od) => o.decimalNumber >= od.decimalNumber).count()
                }));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.TotalAmount).toBe("number");
                    expect(typeof o.Count).toBe("number");
                }
            });
            it("should work in select (Sum SubQuery)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1s.orderBy([(o) => o.dateTime, "DESC"]);
                const ads = Enumerable.from([
                    Object.assign(new Table1(), { id: 1234567890n, decimalNumber: 13200, dateTime: new Date("2017-02-22T23:03:39.447Z") }),
                    Object.assign(new Table1(), { id: 1234567891n, decimalNumber: 71000, dateTime: new Date("2017-01-19T02:08:41.530Z") }),
                ]);
                const subQuery = ad.slice(0, 10).parameter({ ads }).map((o) => ({
                    OrderId: o.id,
                    TotalAmount: o.decimalNumber,
                    Accumulated: Enumerable.from(ads).filter((od) => od.dateTime >= o.dateTime).sum((o) => o.decimalNumber)
                }));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(spy).toHaveBeenCalledTimes(queries.length);
                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.OrderId).toBe("bigint");
                    expect(typeof o.TotalAmount).toBe("number");
                    expect(typeof o.Accumulated).toBe("number");
                }
            });
            it("should work in select (Some SubQuery)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1s.orderBy([(o) => o.decimalNumber, "ASC"]);
                const ads = Enumerable.from([
                    Object.assign(new Table1(), { id: 1234567890n, decimalNumber: 13200, dateTime: new Date("2017-02-22T23:03:39.447Z") }),
                    Object.assign(new Table1(), { id: 1234567891n, decimalNumber: 71000, dateTime: new Date("2017-01-19T02:08:41.530Z") }),
                ]);
                const subQuery = ad.slice(0, 10).parameter({ ads }).map((o) => ({
                    TotalAmount: o.decimalNumber,
                    IsNotLowest: ads.filter((od) => o.decimalNumber > od.decimalNumber).some()
                }));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(spy).toHaveBeenCalledTimes(queries.length);
                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.TotalAmount).toBe("number");
                    expect(typeof o.IsNotLowest).toBe("boolean");
                }
            });
            it("should work in select (Every SubQuery)", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const ad = db.table1s.orderBy([(o) => o.decimalNumber, "DESC"]);
                const ads = Enumerable.from([
                    Object.assign(new Table1(), { id: 1234567890n, decimalNumber: 13200, dateTime: new Date("2017-02-22T23:03:39.447Z") }),
                    Object.assign(new Table1(), { id: 1234567891n, decimalNumber: 71000, dateTime: new Date("2017-01-19T02:08:41.530Z") }),
                ]);
                const subQuery = ad.slice(0, 10).parameter({ ads }).map((o) => ({
                    TotalAmount: o.decimalNumber,
                    IsHighest: ads.every((od) => o.decimalNumber >= od.decimalNumber)
                }));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(spy).toHaveBeenCalledTimes(queries.length);
                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o.TotalAmount).toBe("number");
                    expect(typeof o.IsHighest).toBe("boolean");
                }
            });
        });
        describe("QUERY OPTION", () => {
            it("should show soft deleted", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const softDeleteQuery = db.table1s.option({ includeSoftDeleted: true });
                const results = await softDeleteQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should cache query with different key", () => {
                const queryExcludeSoftDeleted = db.table1s.toString();
                const queryIncludeSoftDeleted = db.table1s.option({ includeSoftDeleted: true }).toString();

                expect(queryExcludeSoftDeleted).not.toBe(queryIncludeSoftDeleted);
            });
        });
        describe("OTHER", () => {
            it("test 1", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const query = db.table1Ones.filter(o => o.name == "filter")
                    .map(o => ({
                        id: o.table1Id,
                        string: o.table1.string,
                        number: o.number,
                        t3Names: o.table1.table1Table2s
                            .flatMap(p => p.table2.table2Table3s)
                            .map(o => o.table3.t3Name)
                            .concat(
                                o.table1.table1Table3s
                                    .map(o => o.table3.t3Name)
                            )
                            .join(',')
                    }));
                const results = await query.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Object);
                    expect(typeof o.id).toBe("bigint");
                    expect(typeof o.string).toBe("string");
                    expect(typeof o.number).toBe("number");
                    expect(o.t3Names).toBeString();
                }
            });
        });
        describe("RAW", () => {
            it("should work", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT 1 as id, 'name 1' as name
UNION ALL
SELECT 2 as id, 'name 2' as name
UNION ALL
SELECT 3 as id, 'name 3' as name`;
                const results = await rawQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results.length).toBeGreaterThan(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Object);
                    expect(o.id).toBeNumber();
                    expect(o.name).toBeString();
                    // TODO: check  db.entry(o); should throw
                }
            });
            it("should support parameter", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results.length).toBeGreaterThan(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Object);
                    expect(o.id).toBeNumber();
                    expect(o.name).toBeString();
                    // TODO: check  db.entry(o); should throw
                }
            });
            it("should filter", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.filter(o => o.id > 1).toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results.length).toBeGreaterThan(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Object);
                    expect(o.id).toBeNumber();
                    expect(o.name).toBeString();
                }
            });
            it("should map", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.map(o => o.name).toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results.length).toBeGreaterThan(0);
                for (const o of results) {
                    expect(o).toBeString();
                }
            });
            it("should order by", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.orderBy([o => o.name, "DESC"]).toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results.length).toBeGreaterThan(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Object);
                    expect(o.id).toBeNumber();
                    expect(o.name).toBeString();
                }
            });
            it("should slice", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.slice(1, 10).toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results.length).toBeGreaterThan(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Object);
                    expect(o.id).toBeNumber();
                    expect(o.name).toBeString();
                }
            });
            it("should some", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.some(o => o.id === 2);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeBoolean();
            });
            it("should every", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.every(o => o.id >= 0);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeBoolean();
            });
            it("should min", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.min(o => o.name);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeString();
            });
            it("should max", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.max(o => o.name);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeString();
            });
            it("should find", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.find();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Object);
                expect(results.id).toBeNumber();
                expect(results.name).toBeString();
            });
            it("should avg", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.avg(o => o.id);

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeNumber();
            });
            it("should count", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.count();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeNumber();
            });
            it("should distinct", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.distinct().toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results.length).toBeGreaterThan(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Object);
                    expect(o.id).toBeNumber();
                    expect(o.name).toBeString();
                }
            });
            it("should group", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: Number, name: String }).fromSql`SELECT ${1} as id, ${"name 1"} as name
UNION ALL
SELECT ${2} as id, ${"name 2"} as name
UNION ALL
SELECT ${3} as id, ${"name 3"} as name`;
                const results = await rawQuery.groupBy(o => o.name).map(o => o.key).toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results.length).toBeGreaterThan(0);
                for (const o of results) {
                    expect(o).toBeString();
                }
            });
            it("should work as subquery", async () => {
                const spy = vi.spyOn(db.connection, "query");

                const rawQuery = db.map({ id: BigInt, name: String }).fromSql`SELECT 1 as id, 'name 1' as name
UNION ALL
SELECT 2 as id, 'name 2' as name
UNION ALL
SELECT 3 as id, 'name 3' as name`;
                const ad = rawQuery.filter((o) => o.id > 5).asSubquery();
                const subQuery = db.table1s.parameter({ ad }).filter((o) => ad.map((od) => od.id).includes(o.id));
                const results = await subQuery.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(o).toBeInstanceOf(Table1);
                }
            });
            it("should union", async () => {
                const spy = vi.spyOn(db.connection, "query");
                
                const rawQuery = db.map({ id: BigInt, name: String }).fromSql`SELECT 1 as id, 'name 1' as name
UNION ALL
SELECT 2 as id, 'name 2' as name
UNION ALL
SELECT 3 as id, 'name 3' as name`;
                const greatest = rawQuery.orderBy([(o) => o.id, "DESC"]).map((o) => o.id).slice(0, 5);
                const worst = db.table1s.orderBy([(o) => o.id, "ASC"]).map(o => o.id).slice(0, 5);
                const join = greatest.union(worst);
                const results = await join.toArray();

                const queries = spy.mock.calls.flatMap(o => o) as unknown as IQuery[];
                expect(queries).toMatchSnapshot();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).not.toBe(0);
                for (const o of results) {
                    expect(typeof o).toBe("bigint");
                }
            });
            it.skip("should not support withRelated if custom schema", async () => {});
            it.skip("should support withRelated if not custom schema", async () => {});
        });
    });
}
