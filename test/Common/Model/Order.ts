import { NumberColumn, PrimaryKey, StringColumn, DateColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { OrderDetail } from "./OrderDetail";

@Entity("Orders")
export class Order {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar" })
    public OrderId: string;

    @NumberColumn({ columnType: "bigint" })
    public Total: number;
    
    @DateColumn()
    public OrderDate: Date;

    public OrderDetails: OrderDetail[];
    // tslint:disable-next-line:no-empty
    constructor() {
    }
}
