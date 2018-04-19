import { PrimaryKey, DateColumn, DeleteColumn, StringColumn, ComputedColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { ListRelation } from "../../../src/Decorator/Relation/ListRelation";
import { Order } from "./Order";
import { EntityBase } from "../../../src/Data/EntityBase";
import { Product } from ".";
import { ScalarRelation } from "../../../src/Decorator/Relation/ScalarRelation";
import { DecimalColumn } from "../../../src/Decorator/Column/DecimalColumn";
import { OrderDetailProperty } from "./OrderDetailProperty";

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
    @DecimalColumn({ columnType: "float", columnName: "Quantity" })
    public quantity: number;
    @DateColumn()
    public CreatedDate: Date;
    @ComputedColumn<OrderDetail>(o => o.quantity * o.Product.Price)
    public GrossSales: number;
    
    @DeleteColumn()
    public isDeleted: boolean;
    @ListRelation<OrderDetail, Order>(Order, [(s) => s.OrderId], [(a) => a.OrderId], (o) => o.OrderDetails)
    public Order: Order;
    
    @ScalarRelation<OrderDetail, Product>(Product, [(s) => s.ProductId], [(a) => a.ProductId])
    public Product: Product;
    // @ListRelation<OrderDetail, OrderDetailProperty>(OrderDetailProperty, [(s) => s.OrderDetailId], [(a) => a.OrderDetailId])
    public OrderDetailProperties: OrderDetailProperty[];
}
