import { NumberColumn, PrimaryKey, StringColumn, DateColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { OrderDetail } from "./OrderDetail";
import { EntityBase } from "../../../src/Data/EntityBase";
import { TimestampColumn } from "../../../src/Decorator/Column/TimestampColumn";

@Entity("Orders")
export class Order extends EntityBase {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar", maxLength: 100 })
    public OrderId: string;

    @NumberColumn({ columnType: "bigint" })
    public TotalAmount: number;
    
    @DateColumn()
    public OrderDate: Date;

    // @TimestampColumn()
    // public Timestamp: string;

    public OrderDetails: OrderDetail[];
    // tslint:disable-next-line:no-empty
}
