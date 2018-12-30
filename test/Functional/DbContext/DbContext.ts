import { MyDb } from "../../Common/MyDb";
import { Order } from "../../Common/Model";
import { expect } from "chai";
import { EntityState } from "../../../src/Data/EntityState";

const db = new MyDb();
afterEach(() => {
    db.clear();
});
describe("DBCONTEXT", () => {
    describe("ATTACH", () => {
        it("should attach entity", () => {
            const entry = db.attach(new Order());
            expect(entry.state).equal(EntityState.Unchanged);
        });
        it("should attach and mark added", () => {
            const entry = db.add(new Order());
            expect(entry.state).equal(EntityState.Added);
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
    describe("ENTITY ENTRY", () => {
        it("should reload all properties", () => {});
        it("should load to-one relation", () => {});
        it("should load to-many relation", () => {});
        it("should load multiple relations", () => {});
    });
});
