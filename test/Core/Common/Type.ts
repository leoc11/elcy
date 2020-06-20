import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import { DefaultQueryCacheManager } from "../../../src/Cache/DefaultQueryCacheManager";
import { ObservableArray } from "../../../src/Common/ObservableArray";
import { TimeSpan } from "../../../src/Common/TimeSpan";
import { mockContext } from "../../../src/Mock/MockContext";
import { MyDb } from "../../Common/MyDb";

chai.use(sinonChai);

const db = new MyDb();
mockContext(db);
db.queryCacheManagerFactory = () => new DefaultQueryCacheManager();
afterEach(() => {
    db.clear();
});

describe("TYPE", () => {
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
    describe("TIMESPAN", () => {
        it("should worked 1", () => {
            const time = new TimeSpan("07:30:12.895");
            expect(time.getHours()).equal(7);
            expect(time.getMinutes()).equal(30);
            expect(time.getSeconds()).equal(12);
            expect(time.getMilliseconds()).equal(895);
            expect(time.totalDays()).equal(0.3126492476851852);
            expect(time.totalHours()).equal(7.503581944444444);
            expect(time.totalMinutes()).equal(450.2149166666666666);
            expect(time.totalSeconds()).equal(‭27012.895);
            expect(time.totalMilliSeconds()).equal(‭27012895‬);
        });
        it("should worked 2", () => {
            const time = new TimeSpan(0);
            expect(time.addHours(1).totalMilliSeconds()).equal(3600000);
            expect(time.addMinutes(1).totalMilliSeconds()).equal(60000);
            expect(time.addSeconds(1).totalMilliSeconds()).equal(1000);
            expect(time.addMilliSeconds(1).totalMilliSeconds()).equal(1);
        });
        it("should worked 3", () => {
            const time = new TimeSpan("07:30:12.895");
            expect(time.valueOf()).to.equal(time.totalMilliSeconds());
            expect(JSON.stringify(time)).to.equal("\"07:30:12.895\"");
        });
    });
});
