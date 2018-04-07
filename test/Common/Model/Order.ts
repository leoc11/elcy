import { NumberColumn, PrimaryKey, StringColumn, DateColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { OrderDetail } from "./OrderDetail";
import { EntityBase } from "../../../src/Data/EntityBase";

@Entity("Orders")
export class Order extends EntityBase {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar" })
    public OrderId: string;

    @NumberColumn({ columnType: "bigint" })
    public TotalAmount: number;
    
    @DateColumn()
    public OrderDate: Date;

    public OrderDetails: OrderDetail[];
    // tslint:disable-next-line:no-empty
}
