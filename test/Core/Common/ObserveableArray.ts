import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import { DefaultQueryCacheManager } from "../../../src/Cache/DefaultQueryCacheManager";
import { ObservableArray } from "../../../src/Common/ObservableArray";
import { mockContext } from "../../../src/Mock/MockContext";
import { MyDb } from "../../Common/MyDb";

chai.use(sinonChai);

const db = new MyDb();
mockContext(db);
db.queryCacheManagerFactory = () => new DefaultQueryCacheManager();
afterEach(() => {
    db.clear();
});

describe("OBOSERVEABLE ARRAY", () => {
    const a = ObservableArray.observe([]);
    const t = {
        add: {
            count: 0,
            items: []
        },
        del: {
            count: 0,
            items: []
        }
    };
    a.register((type, items) => {
        t[type].count++;
        t[type].items = t[type].items.concat(items);
    });
    it("should fire add event", async () => {
        a.push(1, 2);
        a.unshift(0);
        a.splice(3, 0, 3, 4);
        expect(t.add.count).to.equal(3);
        expect(t.add.items).to.deep.equal([1, 2, 0, 3, 4]);
    });
    it("should fire delete event", async () => {
        a.pop();
        a.shift();
        a.splice(0, 2);
        // TODO: should fire del event
        // a.length = 0;
        expect(t.del.count).to.equal(3);
        expect(t.del.items).to.deep.equal([4, 0, 1, 2]);
    });
});
