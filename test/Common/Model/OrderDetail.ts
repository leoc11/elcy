import { PrimaryKey, DateColumn, DeleteColumn, StringColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { ListRelation } from "../../../src/Decorator/Relation/ListRelation";
import { Order } from "./Order";
import { EntityBase } from "../../../src/Data/EntityBase";
import { Product } from ".";
import { ScalarRelation } from "../../../src/Decorator/Relation/ScalarRelation";

@Entity("OrderDetails")
export class OrderDetail extends EntityBase {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar" })
    public OrderDetailId: string;
    @StringColumn({ columnType: "nvarchar" })
    public OrderId: string;
    @StringColumn({ columnType: "nvarchar" })
    public ProductId: string;
    @StringColumn({ columnType: "nvarchar", columnName: "ProductName" })
    public name: string;
    @StringColumn({ columnType: "float", columnName: "Quantity" })
    public quantity: number;
    @DateColumn()
    public CreatedDate: Date;
    
    @DeleteColumn()
    public isDeleted: boolean;
    @ListRelation<OrderDetail, Order>(Order, [(s) => s.OrderId], [(a) => a.OrderId], (o) => o.OrderDetails)
    public Order: Order;
    
    @ScalarRelation<OrderDetail, Product>(Product, [(s) => s.ProductId], [(a) => a.ProductId])
    public Product: Product;
}
