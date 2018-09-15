import { MyDb } from "../../Common/MyDb";
import { Order } from "../../Common/Model";
import { expect } from "chai";
import { EntityState } from "../../../src/Data/EntityState";

describe("DBCONTEXT", () => {
    const db = new MyDb();
    describe("ATTACH", () => {
        it("should attach entity", () => {
            const entry = db.attach(new Order());
            expect(entry.state).equal(EntityState.Unchanged);
            db.clear();
        });
        it("should attach and mark added", () => {
            const entry = db.add(new Order());
            expect(entry.state).equal(EntityState.Added);
            db.clear();
        });
        it("should attach and mark update", () => {
            const entry = db.update(new Order());
            expect(entry.state).equal(EntityState.Modified);
        });
        it("should mark delete", () => {
            const entry = db.delete(new Order());
            expect(entry.state).equal(EntityState.Deleted);
        });
    });
    describe("CHANGES DETECTION", () => {
        it("should detect property changes and reset", () => {

        });
        it("should not detect property changes for readonly property", () => {

        });
        it("should detect relation changes", () => {

        });
    });
});
