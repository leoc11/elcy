import { ValueType } from "../../../src/Common/Type";
import { Uuid } from "../../../src/Common/Uuid";
import { ComputedColumn } from "../../../src/Decorator/Column/ComputedColumn";
import { CreatedDateColumn } from "../../../src/Decorator/Column/CreatedDateColumn";
import { DecimalColumn } from "../../../src/Decorator/Column/DecimalColumn";
import { DeletedColumn } from "../../../src/Decorator/Column/DeletedColumn";
import { IdentifierColumn } from "../../../src/Decorator/Column/IdentifierColumn";
import { NullableColumn } from "../../../src/Decorator/Column/NullableColumn";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { Entity } from "../../../src/Decorator/Entity/Entity";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { Order } from "./Order";
import { OrderDetailProperty } from "./OrderDetailProperty";
import { Product } from "./Product";

@Entity("OrderDetails")
export class OrderDetail {
    constructor(defValues?: { [key in keyof OrderDetail]?: ValueType }) {
        if (defValues) {
            for (const prop in defValues) {
                const value = (defValues as any)[prop];
                this[prop as any] = value;
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
    @CreatedDateColumn()
    public CreatedDate: Date;
    @ComputedColumn<OrderDetail>((o) => o.quantity * o.Product.Price)
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
