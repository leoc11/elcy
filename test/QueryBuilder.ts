import { assert } from "chai";
import { IObjectType } from "../src/Common/Type";
import { NumberColumn, PrimaryKey, StringColumn } from "../src/Decorator/Column/index";
import { Entity } from "../src/Decorator/Entity/index";
import { ListRelation } from "../src/Decorator/Relation/ListRelation";
import { MssqlDbContext } from "../src/Driver/Mssql/MssqlDbContext";
import { DbSet } from "../src/Linq/DbSet";

@Entity("Orders")
class Order {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar" })
    public OrderId: string;

    @NumberColumn({ columnType: "bigint" })
    public Total: number;

    public OrderDetails: OrderDetail[];
}

// tslint:disable-next-line:max-classes-per-file
@Entity("OrderDetails")
class OrderDetail {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar" })
    public OrderDetailId: string;

    @ListRelation<OrderDetail, Order>(Order, [(s) => s.OrderId], [(a) => a.OrderId], (o) => o.OrderDetails)
    @StringColumn({ columnType: "nvarchar" })
    public OrderId: string;

    @StringColumn({ columnType: "nvarchar" })
    public name: string;
}

// tslint:disable-next-line:max-classes-per-file
class MyDb extends MssqlDbContext {
    public entities: IObjectType[] = [Order, OrderDetail];

    public get orders(): DbSet<Order> {
        return this.set(Order);
    }
    public get orderDetails(): DbSet<OrderDetail> {
        return this.set(OrderDetail);
    }
}

describe("Query builder", () => {
    const db = new MyDb({});

    it("parse simple aritmatic", () => {
        const result = db.orders.toString();
        assert.equal(result, "SELECT * FROM Orders");
    });
});
