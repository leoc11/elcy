import { mockContext } from "../../../fixture/mock/MockContext";
import { PostgresqlContext } from "../../../fixture/PostgresqlContext";

const db = new PostgresqlContext();
mockContext(db);
const where = db.table1s.filter((o) => o.bigint <= 10000);
await where.toArray();
if (process.env.BUN_ENV === "test") {
    process.exit(0);
}
