import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { TimeSpan } from "../../Common/TimeSpan";
import { GenericType } from "../../Common/Type";
import { Uuid } from "../../Common/Uuid";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";

export class PostgresqlQueryBuilder extends RelationalQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxParameters: 34464
    };
    public valueTypeMap = new Map<GenericType, (value: unknown) => ICompleteColumnType>([
        [Uuid, () => ({ columnType: "uuid", group: "Identifier" })],
        [TimeSpan, () => ({ columnType: "time", group: "Time" })],
        [Date, () => ({ columnType: "datetime", group: "DateTime" })],
        [String, (val: string) => ({ columnType: "nvarchar", group: "String", option: { length: Math.ceil(val.length / 50) * 50 } })],
        [Number, () => ({ columnType: "decimal", group: "Decimal" })],
        [Boolean, () => ({ columnType: "bit", group: "Boolean" })]
    ]);
}
