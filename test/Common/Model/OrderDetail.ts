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
import { DeletedColumn } from "../../../src/Decorator/Column/DeletedColumn";
import { IdentifierColumn } from "../../../src/Decorator/Column/IdentifierColumn";
import { Uuid } from "../../../src/Data/Uuid";
import { NullableColumn } from "../../../src/Decorator/Column/NullableColumn";

@Entity("OrderDetails")
export class OrderDetail {
    constructor(defValues?: { [key in keyof OrderDetail]?: any }) {
        if (defValues) {
            for (const prop in defValues) {
                const value = (defValues as any)[prop];
                this[prop as keyof OrderDetail] = value;
            }
        }
    }
    @PrimaryKey()
    @IdentifierColumn()
    public OrderDetailId: Uuid;
    @IdentifierColumn()
    @NullableColumn()
    public OrderId: Uuid;
    @IdentifierColumn()
    public ProductId: Uuid;
    @StringColumn({ columnType: "nvarchar", columnName: "ProductName" })
    public name: string;
    @DecimalColumn({ columnType: "decimal", columnName: "Quantity" })
    public quantity: number;
    @DateColumn()
    public CreatedDate: Date;
    @ComputedColumn<OrderDetail>(o => o.quantity * o.Product.Price)
    public GrossSales: number;

    @DeletedColumn()
    public isDeleted: boolean;
    @Relationship<OrderDetail>("has", "by", "one", Order || "Order", [(o) => o.OrderId])
    public Order: Order;
    @Relationship<OrderDetail>("has", "by", "one", Product || "Product", [(o) => o.ProductId])
    public Product: Product;
    @Relationship<OrderDetail>("has", "many", OrderDetailProperty || "OrderDetailProperty", [(o) => o.OrderDetailId])
    public OrderDetailProperties: OrderDetailProperty[];
}
