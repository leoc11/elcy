import { assert } from "chai";
import { PrimaryKey, StringColumn } from "../src/Decorator/Column/index";
import { ExpressionBuilder } from "../src/ExpressionBuilder/ExpressionBuilder";

class Order {
    @PrimaryKey()
    @StringColumn({ columnType = "nvarchar" })
    public OrderId: string;

    @NumberColumn({ columnType = "nvarchar" })
    public Total: number;
}

describe("Query builder", () => {

});
