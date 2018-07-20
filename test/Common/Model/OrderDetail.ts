import { Entity } from "../../../src/Decorator/Entity/Entity";
import { Order } from "./Order";
import { Product } from "./Product";
import { DecimalColumn } from "../../../src/Decorator/Column/DecimalColumn";
import { OrderDetailProperty } from "./OrderDetailProperty";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { DateColumn } from "../../../src/Decorator/Column/DateColumn";
import { ComputedColumn } from "../../../src/Decorator/Column/ComputedColumn";
import { DeleteColumn } from "../../../src/Decorator/Column/DeleteColumn";

@Entity("OrderDetails")
export class OrderDetail {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar" })
    public OrderDetailId: string;
    @StringColumn({ columnType: "nvarchar" })
    public OrderId: string;
    @StringColumn({ columnType: "nvarchar" })
    public ProductId: string;
    @StringColumn({ columnType: "nvarchar", columnName: "ProductName" })
    public name: string;
    @DecimalColumn({ columnType: "decimal", columnName: "Quantity" })
    public quantity: number;
    @DateColumn()
    public CreatedDate: Date;
    @ComputedColumn<OrderDetail>(o => o.quantity * o.Product.Price)
    public GrossSales: number;

    @DeleteColumn()
    public isDeleted: boolean;
    @Relationship<OrderDetail>("has", "by", "one", Order || "Order", [(o) => o.OrderId])
    public Order: Order;
    @Relationship<OrderDetail>("has", "by", "one", Product || "Product", [(o) => o.ProductId])
    public Product: Product;
    @Relationship<OrderDetail>("has", "many", OrderDetailProperty || "OrderDetailProperty", [(o) => o.OrderDetailId])
    public OrderDetailProperties: OrderDetailProperty[];
}
