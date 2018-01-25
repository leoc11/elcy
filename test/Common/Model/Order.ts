import { NumberColumn, PrimaryKey, StringColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { OrderDetail } from "./OrderDetail";

@Entity("Orders")
export class Order {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar" })
    public OrderId: string;

    @NumberColumn({ columnType: "bigint" })
    public Total: number;

    public OrderDetails: OrderDetail[];
    // tslint:disable-next-line:no-empty
    constructor() {
    }
}
