import { RawSchema, RawSchemaType, ValueType } from "../../Common/Type";
import { RawQueryable } from "../../Queryable/RawQueryable";

export interface IRawQueryView<TSchema extends RawSchema> {
    fromSql(strings: TemplateStringsArray, ...values: ValueType[]): RawQueryable<RawSchemaType<TSchema>>
}