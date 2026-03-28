import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { MysqlColumnType } from "./MysqlColumnType";

export class MysqlQueryBuilder extends RelationalQueryBuilder {
    //#region column type map
    public queryLimit: IQueryLimit = {
        maxParameters: 65535,
        maxQueryLength: 8388608
    };
    public valueTypeMap = new Map<GenericType, (value: unknown) => ICompleteColumnType<MysqlColumnType>>([
        [Uuid, () => ({ columnType: "binary", option: { size: 16 } })],
        [BigInt, () => ({ columnType: "bigint" })],
        [TimeSpan, () => ({ columnType: "time" })],
        [Date, () => ({ columnType: "datetime" })],
        [String, (val: string) => ({ columnType: "varchar", option: { length: 255 + (Math.ceil(Math.max(val.length - 255, 0) / 50) * 50) } })],
        [Number, () => ({ columnType: "decimal", option: { precision: 18, scale: 0 } })],
        [Boolean, () => ({ columnType: "bit" })]
    ]);

    //#endregion
    protected override createLiteralTableValueQuery<TE extends object>(entityExp: TemporaryEntityExpression<TE>, values: TE[], param?: IQueryBuilderParameter): string {
        const valueLiterals = values.map(o => {
            const valueQueries = entityExp.columns.map(p => {
                return `${this.valueString(o[p.propertyName] as ValueType)} AS ${this.enclose(p.columnName)}`;
            }).join(", ");
            return `SELECT ${valueQueries}`;
        }).join(`${this.newLine(1, false)}UNION ALL${this.newLine(1, false)}`)
        return `(${this.newLine(1)}${valueLiterals}${this.newLine(-1)}) AS ${this.enclose(entityExp.alias)}`;
    }
    }
}
