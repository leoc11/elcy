import { BigIntColumn } from "../../../../src/Decorator/Column/BigIntColumn";
// import { PrimaryKey } from "../../../../src/Decorator/Column/PrimaryKey";

export class Testing {
    // @PrimaryKey()
    @BigIntColumn({ autoIncrement: true })
    id: bigint;
}

new Testing();
if (process.env.BUN_ENV === "test") {
    process.exit(0);
}
