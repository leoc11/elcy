import { describe } from "bun:test";

describe("QUERYBUILDER", () => {
    describe("EXPRESSION", () => {
        // all expression should be checked here.
    });
    describe("TRANSLATOR", () => {
        // merge query and limit
    });
    describe("MERGE QUERY", () => {
        // merge query and limit
    });
    // describe("TERNARY OPERATOR", () => {
    //     // TODO
    //     it("test 1", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orders.map(o => ({
    //             item: o.TotalAmount > 20000 ? 20000 : o.TotalAmount
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 2", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orderDetails.map(o => ({
    //             item: o.quantity === 1 ? o.Order : null
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 3", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orderDetails.map(o => ({
    //             item: o.quantity === 1 ? o.Order : { OrderId: o.OrderId }
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 4", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orders.map(o => ({
    //             item: o.OrderDate.getDate() === 1 ? o.OrderDetails : null
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 5", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orders.map(o => ({
    //             item: o.OrderDate.getDate() === 1 ? o.OrderDetails.first() : o.OrderDate
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 6", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orderDetails.map(o => ({
    //             item: o.quantity === 1 ? o.OrderDetailProperties : o.Product
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 7", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orders.map(o => ({
    //             item: o.OrderDetails
    //         })).map(o => o.item.count());
    //         const results = await ternary.toArray();
    //     });
    // });
});
