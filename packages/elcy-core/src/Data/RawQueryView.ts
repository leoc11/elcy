import { RawSchema, RawSchemaType, ValueType } from "../Common/Type";
import { RawQueryable } from "../Queryable/RawQueryable";
import { DbContext } from "./DbContext";

export class RawQueryView<TSchema extends RawSchema> {
    constructor(protected readonly schema: TSchema, protected readonly dbContext: DbContext) { }
    fromSql(strings: TemplateStringsArray, ...values: ValueType[]): RawQueryable<RawSchemaType<TSchema>> {
        return new RawQueryable<RawSchemaType<TSchema>>(strings, values, this.schema, this.dbContext);
    }
}