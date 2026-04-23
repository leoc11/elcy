import { QueryType } from "../../Common/Enum";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { TimeZoneHandling } from "../../Common/StringType";
import { ArrayView, GenericType, MethodKey, MethodReturnType, SetterObj, StringKeyOf, ValueType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { Enumerable, IEnumerable, IObjectType } from "@elcy/enumerable";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { FunctionCallExpression } from "../../ExpressionBuilder/Expression/FunctionCallExpression";
import { IBinaryOperatorExpression } from "../../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { InstantiationExpression } from "../../ExpressionBuilder/Expression/InstantiationExpression";
import { IUnaryOperatorExpression } from "../../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { TernaryExpression } from "../../ExpressionBuilder/Expression/TernaryExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { ExpressionExecutor } from "../../ExpressionBuilder/ExpressionExecutor";
import { fillZero, isColumnExp, isEntityExp, isNotNull, isNull, isValue, mapReplaceExp, toDateTimeString, toHexaString, toTimeString } from "../../Helper/Util";
import { DateTimeColumnMetaData } from "../../MetaData/DateTimeColumnMetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { TimeColumnMetaData } from "../../MetaData/TimeColumnMetaData";
import { BatchedQuery } from "../../Query/BatchedQuery";
import { DbFunction } from "../../Query/DbFunction";
import { IQuery } from "../../Query/IQuery";
import { IQueryBuilder } from "../../Query/IQueryBuilder";
import { IQueryBuilderContext } from "../../Query/IQueryBuilderContext";
import { IQueryOption } from "../../Query/IQueryOption";
import { ISqlParameterValueMap } from "../../Query/IQueryParameter";
import { IQueryTranslatorItem } from "../../Query/IQueryTranslatorItem";
import { AliasType, NamingStrategy } from "../../Query/NamingStrategy";
import { HavingJoinRelation } from "../../Queryable/Interface/HavingJoinRelation";
import { IncludeRelation } from "../../Queryable/Interface/IncludeRelation";
import { ISelectRelation } from "../../Queryable/Interface/ISelectRelation";
import { JoinRelation } from "../../Queryable/Interface/JoinRelation";
import { ColumnExpression } from "../../Queryable/QueryExpression/ColumnExpression";
import { ComputedColumnExpression } from "../../Queryable/QueryExpression/ComputedColumnExpression";
import { DeleteExpression } from "../../Queryable/QueryExpression/DeleteExpression";
import { ExceptExpression } from "../../Queryable/QueryExpression/ExceptExpression";
import { GroupByExpression } from "../../Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "../../Queryable/QueryExpression/IColumnExpression";
import { IEntityExpression } from "../../Queryable/QueryExpression/IEntityExpression";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { InsertIntoExpression } from "../../Queryable/QueryExpression/InsertIntoExpression";
import { IntersectExpression } from "../../Queryable/QueryExpression/IntersectExpression";
import { IQueryExpression } from "../../Queryable/QueryExpression/IQueryExpression";
import { ProjectionEntityExpression } from "../../Queryable/QueryExpression/ProjectionEntityExpression";
import { RawSqlExpression } from "../../Queryable/QueryExpression/RawSqlExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { SqlParameterExpression } from "../../Queryable/QueryExpression/SqlParameterExpression";
import { SqlTableValueParameterExpression, TSchema } from "../../Queryable/QueryExpression/SqlTableValueParameterExpression";
import { UnionExpression } from "../../Queryable/QueryExpression/UnionExpression";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { UpsertExpression } from "../../Queryable/QueryExpression/UpsertExpression";
import { relationalQueryTranslator } from "./RelationalQueryTranslator";
import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { RawEntityExpression } from "src/Queryable/QueryExpression/RawEntityExpression";
import { ConcatExpression } from "src/Queryable/QueryExpression/ConcatExpression";
import { Temporal } from "src/Data/Temporal";
import { Decimal } from "src/Data/Decimal";
import { SerializeColumnMetaData } from "src/MetaData/SerializeColumnMetaData";
import { IQueryIncludeRelation } from "src/Queryable/QueryExpression/IQueryIncludeRelation";

export abstract class RelationalQueryBuilder implements IQueryBuilder {
    public get lastInsertIdQuery() {
        if (!this._lastInsertedIdQuery) {
            this._lastInsertedIdQuery = this.toString(ExpressionBuilder.parse(() => DbFunction.lastInsertedId()).body);
        }
        return this._lastInsertedIdQuery;
    }
    public namingStrategy: NamingStrategy;
    public abstract queryLimit: IQueryLimit;
    public translator = relationalQueryTranslator;
    public abstract valueTypeMap: Map<GenericType, (value?: unknown) => ICompleteColumnType>;

    //#region Formatting
    protected indent = 0;
    private _lastInsertedIdQuery: string;
    private aliasObj: { [key: string]: number } = {};
    public columnTypeString(columnType: ICompleteColumnType): string {
        let type = columnType.columnType;
        if (columnType.option) {
            const option = columnType.option;
            if (isNotNull(option.length) || isNotNull(option.size)) {
                type += `(${option.length || option.size})`;
            }
            else if (isNotNull(option.precision)) {
                type += isNotNull(option.scale) ? `(${option.precision}, ${option.scale})` : `(${option.precision})`;
            }
        }
        return type;
    }
    public enclose(identity: string) {
        let requireEscape = this.namingStrategy.enableEscape;
        if (!requireEscape) {
            requireEscape = identity.search(/[ ]/) !== -1;
        }
        if (requireEscape) {
            return this.encloseIdentifier(identity);
        }

        return identity;
    }
    public encloseIdentifier(identity: string) {
        return `"${identity}"`;
    }
    //#endregion

    public mergeQueries(queries: IEnumerable<IQuery>): IQuery[] {
        const result: IQuery[] = [];
        let batch: BatchedQuery = null;
        let paramCount = 0;
        let queryLength = 0;
        let prev: IQuery;
        for (const o of queries) {
            if (!prev && !batch) {
                prev = o;
                continue;
            }

            let isLimitExceed = true;
            if (batch) {
                const qParamCount = o.parameters ? o.parameters.size : 0;
                isLimitExceed = this.queryLimit.maxBatchQuery && batch.queryCount >= this.queryLimit.maxBatchQuery
                    || this.queryLimit.maxQueryLength && (queryLength + o.query.length + 3) > this.queryLimit.maxQueryLength
                    || this.queryLimit.maxParameters && paramCount + qParamCount > this.queryLimit.maxParameters;
                if (!isLimitExceed) {
                    paramCount += qParamCount;
                    queryLength += o.query.length + 3;
                }
            }
            else {
                const newQueryLength = (o.query.length + prev.query.length + 3);
                const newParamSize = (o.parameters?.size ?? 0) + (prev.parameters?.size ?? 0);
                isLimitExceed = this.queryLimit.maxBatchQuery && 2 >= this.queryLimit.maxBatchQuery
                    || this.queryLimit.maxQueryLength && newQueryLength > this.queryLimit.maxQueryLength
                    || this.queryLimit.maxParameters && newParamSize > this.queryLimit.maxParameters;

                if (!isLimitExceed) {
                    batch = new BatchedQuery();
                    batch.add(prev);
                    prev = undefined;
                    paramCount = newParamSize;
                    queryLength = newQueryLength;
                    result.push(batch);
                }
            }

            if (!isLimitExceed) {
                batch.add(o);
            }
            else {
                if (prev) {
                    result.push(prev);
                }
                prev = o;
                batch = undefined;
            }
        }

        if (prev) {
            result.push(prev);
        }

        return result;
    }
    public newAlias(type: AliasType = "entity") {
        if (!this.aliasObj[type]) {
            this.aliasObj[type] = 0;
        }
        return this.namingStrategy.getAlias(type) + this.aliasObj[type]++;
    }
    public newLine(indent = 0, isAdd = true) {
        indent += this.indent;
        if (isAdd) {
            this.indent = indent;
        }
        return "\n" + (Array(indent + 1).join("\t"));
    }

    public resolveTranslator<T = any>(object: T, memberName?: StringKeyOf<T>) {
        return this.translator.resolve(object, memberName);
    }
    public toLogicalString(expression: IExpression<boolean>, param?: IQueryBuilderContext) {
        if (isColumnExp(expression)) {
            expression = new EqualExpression(expression, new ValueExpression(true));
        }
        return this.toString(expression, param);
    }
    public toOperandString(expression: IExpression, param?: IQueryBuilderContext): string {
        return this.toString(expression, param);
    }
    public toParameterValue(input: any, column: IColumnMetaData): any {
        if (!isNotNull(input)) {
            return null;
        }
        let result = input;
        const type = column ? column.type : input.constructor;
        switch (type) {
            case Date: {
                const timeZoneHandling: TimeZoneHandling = column instanceof DateTimeColumnMetaData ? column.timeZoneHandling : "none";
                if (timeZoneHandling !== "none") {
                    result = (result as Date).toUTCDate();
                }
                break;
            }
            case TimeSpan: {
                result = typeof input === "number" ? new TimeSpan(input) : TimeSpan.parse(input);
                const timeZoneHandling: TimeZoneHandling = column instanceof TimeColumnMetaData ? column.timeZoneHandling : "none";
                if (timeZoneHandling !== "none") {
                    result = (result as TimeSpan).addMinutes((new Date(result.totalMilliSeconds())).getTimezoneOffset());
                }
                break;
            }
            case ArrayBuffer:
            case Uint8Array:
            case Uint16Array:
            case Uint32Array:
            case Int8Array:
            case Int16Array:
            case Int32Array:
            case Uint8ClampedArray:
            case Float32Array:
            case Float64Array:
            case DataView: {
                result = new Uint8Array(input.buffer ? input.buffer : input);
                if (column instanceof ColumnExpression && column.columnMeta instanceof RowVersionColumnMetaData) {
                    return new DataView(result.buffer).getUint32(0);
                }
                break;
            }
        }
        return result;
    }

    //#endregion

    //#region Value Convert
    public toPropertyValue<T>(input: any, column: IColumnMetaData<any, T>): T {
        let result: any;
        if (isNull(input) && column.nullable) {
            return null;
        }
        if (column instanceof SerializeColumnMetaData) {
            let data: any;
            try {
                data = JSON.parse(input);
            } catch {
                return null;
            }

            try {
                const obj = new column.type();
                const keys = Enumerable.from(Object.entries(obj))
                    .filter(o => typeof o[1] !== "function" && (isNull(o[1]) || isValue(o[1])))
                    .map(o => o[0])
                    .union(Object.keys(data));

                for (const key of keys) {
                    obj[key] = data[key];
                }

                return obj;
            }
            catch {
                return data;
            }
        }

        const type = column.type as GenericType;
        switch (true) {
            case type === Boolean:
                result = Boolean(input);
                break;
            case type === BigInt: {
                result = BigInt(input);
                break;
            }
            case type === Number:
                result = Number.parseFloat(input);
                if (!isFinite(result)) {
                    result = column.nullable ? null : 0;
                }
                break;
            case type === String:
                result = input ? input.toString() : input;
                break;
            case type === Date: {
                result = new Date(input);
                const timeZoneHandling: TimeZoneHandling = column instanceof DateTimeColumnMetaData ? column.timeZoneHandling : "none";
                if (timeZoneHandling === "utc") {
                    result = new Date(`${result.getFullYear()}-${fillZero(result.getMonth() + 1)}-${fillZero(result.getDate())}T${fillZero(result.getHours())}:${fillZero(result.getMinutes())}:${fillZero(result.getSeconds())}.${fillZero(result.getMilliseconds(), 3)}Z`);
                }
                break;
            }
            case type === TimeSpan: {
                result = typeof input === "number" ? new TimeSpan(input) : TimeSpan.parse(input);
                const timeZoneHandling: TimeZoneHandling = column instanceof TimeColumnMetaData ? column.timeZoneHandling : "none";
                if (timeZoneHandling !== "none") {
                    result = result.addMinutes(-(new Date(result.totalMilliSeconds())).getTimezoneOffset());
                }
                break;
            }
            case type === Uuid: {
                result = input ? new Uuid(input.toString()) : Uuid.empty;
                break;
            }
            case type === ArrayBuffer: {
                result = input.buffer ? input.buffer : input;
                break;
            }
            case type === Uint8Array:
            case type === Uint16Array:
            case type === Uint32Array:
            case type === Int8Array:
            case type === Int16Array:
            case type === Int32Array:
            case type === Uint8ClampedArray:
            case type === Float32Array:
            case type === Float64Array:
            case type === DataView: {
                if (typeof input === "number") {
                    const dataView = new DataView(new ArrayBuffer(4));
                    dataView.setUint32(0, input);
                    input = dataView.buffer;
                }

                result = new (column.type as any)(input.buffer ? input.buffer : input);
                break;
            }
            case Temporal && type === Temporal?.Instant: {
                const date = new Date(input);
                result = Temporal.Instant.fromEpochMilliseconds(date.getTime());
                break;
            }
            case Temporal && type === Temporal?.PlainDate: {
                const date = new Date(input);
                result = new Temporal.PlainDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
                break;
            }
            case Temporal && type === Temporal.PlainTime: {
                result = Temporal.PlainTime.from(String(input));
                break;
            }
            case Decimal && type === Decimal: {
                result = new Decimal(String(input));
                break;
            }
            default:
                throw new Error(`${column.type.name} not supported`);
        }
        return result;
    }

    //#region Query
    public toQuery<T>(queryExpression: IQueryExpression<T>, parameters?: ISqlParameterValueMap, option?: IQueryOption): IQuery[] {
        if (queryExpression instanceof SelectExpression) {
            return this.getSelectQuery(queryExpression, option, parameters);
        }
        if (queryExpression instanceof InsertIntoExpression) {
            return this.getInsertIntoQuery(queryExpression, option, parameters);
        }
        if (queryExpression instanceof InsertExpression) {
            return this.getInsertQuery(queryExpression, option, parameters);
        }
        if (queryExpression instanceof UpdateExpression) {
            return this.getUpdateQuery(queryExpression, option, parameters);
        }
        if (queryExpression instanceof UpsertExpression) {
            return this.getUpsertQuery(queryExpression, option, parameters);
        }
        if (queryExpression instanceof DeleteExpression) {
            return this.getDeleteQuery(queryExpression, option, parameters);
        }

        return [];
    }
    public toString<T = any>(expression: IExpression<T>, param?: IQueryBuilderContext): string {
        switch (true) {
            case expression instanceof MemberAccessExpression:
                return this.toMemberAccessString(expression, param);
            case expression instanceof MethodCallExpression:
                return this.toMethodCallString(expression, param);
            case expression instanceof FunctionCallExpression:
                return this.toFunctionCallString(expression, param);
            case expression instanceof SqlParameterExpression:
                return this.toSqlParameterString(expression, param);
            case expression instanceof ArrayValueExpression:
                return this.toArrayString(expression, param);
            case expression instanceof ValueExpression:
                return this.toValueString(expression, param);
            case expression instanceof InstantiationExpression:
                return this.toInstantiationString(expression, param);
            case expression instanceof RawSqlExpression:
                return this.toRawSqlString(expression, param);
            case expression instanceof SelectExpression:
                return this.toSelectString(expression, param);
            default: {
                if (isColumnExp(expression)) {
                    return this.getColumnQueryString(expression, param);
                }
                else if (isEntityExp(expression)) {
                    return this.toEntityString(expression);
                }
                else if (expression instanceof TernaryExpression) {
                    return this.toOperatorString(expression as any, param);
                }
                else if ((expression as IBinaryOperatorExpression).rightOperand) {
                    return `(${this.toOperatorString(expression as any, param)})`;
                }
                else if ((expression as IUnaryOperatorExpression).operand) {
                    return this.toOperatorString(expression as any, param);
                }
            }
        }

        throw new Error(`Expression ${expression.toString()} not supported`);
    }
    //#endregion

    //#region Value
    public valueString(value: ValueType): string {
        if (isNull(value)) {
            return this.nullString();
        }

        switch (value.constructor) {
            case Number:
                return this.numberString(value as number);
            case BigInt:
                return this.bigIntString(value as bigint);
            case Boolean:
                return this.booleanString(value as boolean);
            case String:
                return this.stringString(value as string);
            case Date:
                return this.dateTimeString(value as Date);
            case TimeSpan:
                return this.timeString(value as TimeSpan);
            case Uuid:
                return this.identifierString(value as Uuid);
            case ArrayBuffer:
            case Uint8Array:
            case Uint16Array:
            case Uint32Array:
            case Int8Array:
            case Int16Array:
            case Int32Array:
            case Uint8ClampedArray:
            case Float32Array:
            case Float64Array:
            case DataView:
                return toHexaString(value as (ArrayBuffer | ArrayView));
            case Temporal.Instant: {
                return this.stringString((value as Temporal.Instant).toString());
            }
            case Temporal.PlainDate: {
                return this.stringString((value as Temporal.PlainDate).toString());
            }
            case Temporal.PlainTime: {
                return this.stringString((value as Temporal.PlainTime).toString());
            }
            case Decimal: {
                return this.stringString((value as Decimal).toFixed());
            }
            default:
                throw new Error(`type "${value.constructor.name}" not supported`);
        }
    }
    protected booleanString(value: boolean): string {
        return value ? "true" : "false";
    }
    protected dateTimeString(value: Date): string {
        return this.stringString(toDateTimeString(value));
    }
    //#endregion

    //#region refactor
    public extractValue<T>(exp: IExpression<T>, param?: IQueryBuilderContext): T | undefined {
        if (exp instanceof ValueExpression) {
            return exp.value;
        }
        else if (exp instanceof SqlParameterExpression) {
            const takeParam = param.parameters.get(exp);
            if (takeParam) {
                return takeParam.value as T;
            }
        }
        return undefined;
    }
    protected getColumnQueryString<TE extends object>(column: IColumnExpression<TE>, param?: IQueryBuilderContext) {
        if (param && param.queryExpression) {
            if (param.queryExpression instanceof SelectExpression) {
                const commandExp = param.queryExpression;

                if (column.entity.alias === commandExp.entity.alias || (commandExp instanceof GroupByExpression && isEntityExp(commandExp.key) && commandExp.key.alias === column.entity.alias)) {
                    if (column instanceof ComputedColumnExpression && (param.state !== "column-declared" || !commandExp.resolvedSelects.includes(column))) {
                        return this.toOperandString(column.expression, param);
                    }
                    return this.toString(column.entity) + "." + this.enclose(column.columnName);
                }
                else {
                    // need refactor, coz builder should not concern itself with this. it is visitor job. build should only do minimal work.
                    // now it needed coz select column from join table join child table.
                    let childSelect = commandExp.resolvedJoins.map((o) => o.child).find((selectExp) => selectExp.allSelects.some((o) => o.entity.alias === column.entity.alias));
                    if (!childSelect) {
                        childSelect = commandExp.parentRelation?.parent;
                    }
                    if (!childSelect) {
                        return this.toString(column.entity) + "." + this.enclose(column.columnName);
                    }

                    const useAlias = !commandExp.projectedColumns.includes(column);
                    return this.toString(childSelect.entity) + "." + this.enclose(useAlias ? column.dataPropertyName : column.columnName);
                }
            }
            else if (param.queryExpression instanceof InsertExpression) {
                const commandExp = param.queryExpression;

                if (column.entity.alias === commandExp.entity.alias) {
                    if (column instanceof ComputedColumnExpression && (param.state !== "column-declared" || !commandExp.columns.includes(column))) {
                        return this.toOperandString(column.expression, param);
                    }
                    return this.toString(column.entity) + "." + this.enclose(column.columnName);
                }
            }
            else if (param.queryExpression instanceof UpdateExpression) {
                const commandExp = param.queryExpression;

                if (column.entity.alias === commandExp.entity.alias) {
                    if (column instanceof ComputedColumnExpression && (param.state !== "column-declared" || !commandExp.entity.columns.includes(column))) {
                        return this.toOperandString(column.expression, param);
                    }
                    return this.toString(column.entity) + "." + this.enclose(column.columnName);
                }
            }
            return this.toString(column.entity) + "." + this.enclose(column.dataPropertyName);
        }

        return this.enclose(column.dataPropertyName);
    }
    protected getEntityQueryString<TE extends object>(entity: IEntityExpression<TE>, param?: IQueryBuilderContext): string {
        let entityQ = "";
        if (entity instanceof UnionExpression) {
            entityQ = `(${this.newLine(1)}` +
                entity.subSelects.map(o => this.toSelectString(o, param)).join(`${this.newLine()}UNION${this.newLine()}`) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof IntersectExpression) {
            entityQ = `(${this.newLine(1)}` +
                entity.subSelects.map(o => this.toSelectString(o, param)).join(`${this.newLine()}INTERSECT${this.newLine()}`) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof ExceptExpression) {
            entityQ = `(${this.newLine(1)}` +
                entity.subSelects.map(o => this.toSelectString(o, param)).join(`${this.newLine()}EXCEPT${this.newLine()}`) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof ConcatExpression) {
            entityQ = `(${this.newLine(1)}` +
                entity.subSelects.map(o => this.toSelectString(o, param)).join(`${this.newLine()}UNION ALL${this.newLine()}`) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof ProjectionEntityExpression) {
            entityQ = `(${this.newLine(1)}` +
                this.toSelectString(entity.subSelect, param) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof RawEntityExpression) {
            entityQ = `(${entity.sqlTemplateStrings.reduce((res, str, i) => {
                let paramName = "";
                if (entity.parameters.length > i) {
                    paramName = this.toSqlParameterString(entity.parameters[i], param);
                }
                return res + str + paramName;
            }, "")})`;
        }
        else if (entity instanceof SqlTableValueParameterExpression) {
            if (param?.option?.supportTVP) {
                entityQ = this.toSqlParameterString(entity, param);
            }
            else {
                if (entity.asTempTable) {
                    entityQ = this.entityName(entity);
                }
                else {
                    const paramValue = param.parameters.get(entity);
                    return this.toTableValueConstructorQuery(entity, paramValue.value as TE[], param);
                }
            }
        }
        else {
            entityQ = this.entityName(entity);
        }

        return entityQ + (entity.alias ? " AS " + this.enclose(entity.alias) : "");
    }
    protected entityName<T extends object>(entityExp: IEntityExpression<T>) {
        let schemaString = "";
        if (entityExp.schema) {
            schemaString = `${this.enclose(entityExp.schema)}.`;
        }
        return schemaString + this.enclose(entityExp.name);
    }
    protected getInsertIntoQuery<TE extends object>(insertIntoExp: InsertIntoExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        const result: IQuery[] = [];
        const context = this.createContext(insertIntoExp, parameters, option);

        const selectString = this.toSelectString(insertIntoExp.select, context);
        const columns = insertIntoExp.columns.map((o) => this.enclose(o.columnName)).join(",");
        const selectQuery = `INSERT INTO ${this.entityName(insertIntoExp.entity)} (${columns})` + this.newLine() + selectString;
        result.push({
            query: selectQuery,
            type: QueryType.DML,
            parameters: this.getParameter(context)
        });

        return result;
    }
    protected getJoinQueryString<TE extends object>(joins: IEnumerable<JoinRelation<TE>>, param?: IQueryBuilderContext): string {
        let result = "";
        if (joins.some(() => true)) {
            result += this.newLine();
            result += Enumerable.from(joins).map((o) => {
                const childString = this.isSimpleSelect(o.child) ? this.getEntityQueryString(o.child.entity, param)
                    : "(" + this.newLine(1) + this.toSelectString(o.child, param) + this.newLine(-1) + ") AS " + this.enclose(o.child.entity.alias ?? o.child.entity.name);

                let joinStr = `${o.type} JOIN ${childString}`;
                if (o.relation) {
                    joinStr += ` ON ${this.toString(o.relation, param)}`;
                }

                return joinStr;
            }).toArray().join(this.newLine());
        }
        return result;
    }
    protected getPagingQueryString<TE extends object>(sqlExp: SelectExpression<TE>, param?: IQueryBuilderContext): string {
        let result = "";
        if (sqlExp.orders.length <= 0) {
            if (sqlExp.distinct || sqlExp.isAggregated) {
                result += `${this.newLine()}ORDER BY ${this.toString(sqlExp.projectedColumns.find(o => true), param)}`;
            }
            else {
                let column = sqlExp.entity.primaryColumns[0];
                if (!column) {
                    column = sqlExp.entity.columns[0];
                }
                result += `${this.newLine()}ORDER BY ${this.toString(column, param)}`;
            }
        }
        if (sqlExp.paging.skip) {
            result += `${this.newLine()}OFFSET ${this.toString(sqlExp.paging.skip, param)} ROWS`;
        }
        if (sqlExp.paging.take) {
            result += `${this.newLine()}FETCH NEXT ${this.toString(sqlExp.paging.take, param)} ROWS ONLY`;
        }
        return result;
    }
    protected getParameter(param: IQueryBuilderContext) {
        const paramObj = new Map<string, any>();
        let qparams = this.getQueryParameters(param);
        if (!param.option?.supportTVP) {
            qparams = qparams.filter(o => !(o instanceof SqlTableValueParameterExpression));
        }
        for (const [k, p] of param.parameters) {
            if (!qparams.includes(k)) {
                continue;
            }
            if (k instanceof SqlTableValueParameterExpression) {
                paramObj.set(`:${p.name}`, JSON.stringify(p.value));
            }
            else {
                paramObj.set(`:${p.name}`, p.value);
            }
        }

        return paramObj;
    }
    protected getParentJoinQueryString(parentRel: IQueryIncludeRelation, param?: IQueryBuilderContext) {
        if (!parentRel || parentRel instanceof JoinRelation) {
            return "";
        }

        let parent = parentRel.parent;
        while ((parent.parentRelation as ISelectRelation)?.isEmbedded) {
            parent = parent.parentRelation.parent;
        }

        let parentSelect: SelectExpression;
        switch (true) {
            case parent instanceof SelectExpression: {
                parentSelect = parent;
                break;
            }
            case parent instanceof UpdateExpression:
            case parent instanceof DeleteExpression: {
                parentSelect = parent.select;
                break;
            }
            default: {
                throw "invalid parent";
            }
        }
        const entityString = this.isSimpleSelect(parentSelect) ? this.getEntityQueryString(parent.entity, param) : `(${this.newLine(1)}${this.toSelectString(parentSelect, param)}${this.newLine(-1)}) AS ${this.enclose(parent.entity.alias ?? parent.entity.name)}`;
        const relationString = this.toLogicalString(parentRel.relation, param);
        return this.newLine() + `INNER JOIN ${entityString} ON ${relationString}`;
    }
    // TODO: catch paramExps at querycache
    protected getQueryParameters(param: IQueryBuilderContext) {
        const queryExp = param.rootQueryExpression ?? param.queryExpression;
        let paramExps = Enumerable.from(queryExp.paramExps);
        if (!(queryExp.parentRelation instanceof IncludeRelation)) {
            return paramExps;
        }

        let parentRelation = queryExp.parentRelation as ISelectRelation;
        while (parentRelation) {
            paramExps = paramExps.union(parentRelation.parent.paramExps);
            parentRelation = parentRelation.parent?.parentRelation;
        }

        return paramExps;
    }
    protected createContext(queryExp: IQueryExpression, parameters: ISqlParameterValueMap, option: IQueryOption): IQueryBuilderContext {
        return {
            queryExpression: queryExp,
            parameters: parameters,
            option: option
        };
    }
    protected getSelectQuery<TE extends object>(selectExp: SelectExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        let result: IQuery[] = [];
        const context = this.createContext(selectExp, parameters, option);

        const useTempTable = !option?.supportTVP && !selectExp.parentRelation && selectExp.includes.length;
        if (useTempTable) {
            for (const [key, valueExp] of parameters) {
                if (!(key instanceof SqlTableValueParameterExpression)) {
                    continue;
                }

                key.asTempTable = true;
                result.push(...this.getTempTableQuery(key, valueExp.value as unknown[], context));
            }
        }

        let skipInclude = false;
        // subselect should not have include
        if (selectExp.isSubSelect) {
            skipInclude = true;
        }

        if (!skipInclude) {
            // select each include as separated query as it more beneficial for performance
            for (const include of selectExp.resolvedIncludes) {
                if (!include.isManyToManyRelation) {
                    result = result.concat(this.getSelectQuery(include.child, context.option, context.parameters));
                }
                else {
                    // create relation data (clone select join clone child)
                    ArrayExtension.delete(selectExp.includes, include);
                    const cloneEntity = selectExp.entity.clone();
                    cloneEntity.isRelationData = true;
                    const relationData = new SelectExpression(cloneEntity);
                    cloneEntity.alias = "rel_" + cloneEntity.alias;

                    const childSelect = include.child;

                    const joinChildSelect = childSelect.clone();
                    joinChildSelect.entity.alias = "rel_" + joinChildSelect.entity.alias;

                    const relDataCloneMap = new Map();
                    mapReplaceExp(relDataCloneMap, childSelect, joinChildSelect);
                    mapReplaceExp(relDataCloneMap, selectExp, relationData);
                    relationData.includes = [];
                    relationData.addJoin(joinChildSelect, include.relation.clone(relDataCloneMap), "INNER");
                    relationData.selects = [];
                    relationData.itemExpression = new ObjectValueExpression({});
                    relationData.distinct = true;

                    // Bridge to Child relation
                    let bridgeChildRelation: IExpression<boolean>;
                    for (const childCol of childSelect.primaryKeys) {
                        const bridgeCol = relationData.allColumns.find((o) => o.columnName === childCol.columnName);
                        relationData.selects.push(bridgeCol);
                        const logicalExp = new StrictEqualExpression(bridgeCol, childCol);
                        bridgeChildRelation = bridgeChildRelation ? new AndExpression(bridgeChildRelation, logicalExp) : logicalExp;
                    }
                    relationData.addInclude(include.name, childSelect, bridgeChildRelation, "one");

                    // Parent to Bridge relation
                    let parentBridgeRelation: IExpression<boolean>;
                    const cloneMap = new Map();
                    mapReplaceExp(cloneMap, selectExp.entity, relationData.entity);
                    for (const parentCol of selectExp.primaryKeys) {
                        let bridgeCol = relationData.allColumns.find((o) => o.columnName === parentCol.columnName);
                        if (!bridgeCol) {
                            bridgeCol = parentCol.clone(cloneMap);
                        }
                        relationData.selects.push(bridgeCol);
                        const logicalExp = new StrictEqualExpression(parentCol, bridgeCol);
                        parentBridgeRelation = parentBridgeRelation ? new AndExpression(parentBridgeRelation, logicalExp) : logicalExp;
                    }
                    selectExp.addInclude(include.name, relationData, parentBridgeRelation, "many");

                    result = result.concat(this.getSelectQuery(relationData, context.option, context.parameters));
                }
            }
        }

        // select include before parent, coz result parser will parse include first before parent.
        // this way it will be much more easier to implement async iterator.
        result.push({
            query: this.toSelectString(selectExp, context),
            type: QueryType.DQL,
            parameters: this.getParameter(context)
        });
        return result;
    }
    protected toEntityString<TE extends object>(entityExp: IEntityExpression<TE>) {
        return this.enclose(entityExp.alias ?? `${entityExp.schema ? `${entityExp.schema}.` : ""}${entityExp.name}`);
    }
    protected toSelectString<TE extends object>(selectExp: SelectExpression<TE>, context?: IQueryBuilderContext): string {
        const distinct = selectExp.distinct ? " DISTINCT" : "";
        context = {
            ...context,
            rootQueryExpression: context.queryExpression,
            queryExpression: selectExp
        };

        const selects = Enumerable.from(selectExp.projectedColumns)
            .map((o) => {
                let colStr = this.getColumnQueryString(o, context);
                // NOTE: computed column should always has alias
                if (o.alias) {
                    colStr += " AS " + this.enclose(o.alias);
                }

                return colStr;
            })
            .toArray()
            .join("," + this.newLine(1, false));

        const entityQ = this.getEntityQueryString(selectExp.entity, context);

        if (selectExp instanceof GroupByExpression && !selectExp.isAggregated && selectExp.having && !Enumerable.from(selectExp.joins).ofType(HavingJoinRelation).some()) {
            const clone = selectExp.clone();
            clone.entity.alias = "rel_" + clone.entity.alias;
            clone.isAggregated = true;
            clone.distinct = true;
            clone.selects = clone.resolvedGroupBy.slice();

            let relation: IExpression<boolean>;
            for (const col of selectExp.resolvedGroupBy) {
                const cloneCol = clone.resolvedGroupBy.find((o) => o.dataPropertyName === col.dataPropertyName);
                const logicalExp = new StrictEqualExpression(col, cloneCol);
                relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
            }

            const joinRel = clone.parentRelation = new JoinRelation(selectExp, clone, relation, "INNER");
            selectExp.joins.push(joinRel);
        }

        const joinStr = this.getJoinQueryString(selectExp.resolvedJoins, context) + this.getParentJoinQueryString(selectExp.parentRelation, context);

        let selectQuerySuffix = "";
        if (selectExp.where) {
            context.state = "column-declared";
            selectQuerySuffix += this.newLine() + "WHERE " + this.toLogicalString(selectExp.where, context);
            context.state = "";
        }

        if (selectExp instanceof GroupByExpression && selectExp.isAggregated) {
            if (selectExp.groupBy.length > 0) {
                selectQuerySuffix += this.newLine() + "GROUP BY " + selectExp.resolvedGroupBy.map((o) => this.getColumnQueryString(o, context)).join(", ");
            }
            if (selectExp.having) {
                selectQuerySuffix += this.newLine() + "HAVING " + this.toLogicalString(selectExp.having, context);
            }
        }

        const hasPagination = selectExp.paging.skip || selectExp.paging.take;
        if (selectExp.resolvedOrders.some(o => true) && (hasPagination || ((context.rootQueryExpression ?? context.queryExpression) == selectExp && !(selectExp.parentRelation instanceof JoinRelation)))) {
            selectQuerySuffix += this.newLine() + "ORDER BY " + selectExp.resolvedOrders.map((c) => this.toString(c.column, context) + " " + c.direction).join(", ");
        }

        if (hasPagination) {
            selectQuerySuffix += this.getPagingQueryString(selectExp, context);
        }

        return `SELECT${distinct} ${selects}`
            + this.newLine() + `FROM ${entityQ}${joinStr}${selectQuerySuffix}`;
    }
    protected createTVPExp<TE extends object>(alias: string, columns: IEnumerable<IColumnExpression<TE>>, values: SetterObj<TE>[], context: IQueryBuilderContext) {
        const tvpExp = new SqlTableValueParameterExpression(new ParameterExpression(this.newAlias("param"), Array as IObjectType<TE[]>), {} as TSchema<TE>, undefined, alias);
        const tvpValues: TE[] = [];
        for (const col of columns) {
            tvpExp.columns.push(new ColumnExpression(tvpExp, col.type, col.propertyName, col.columnName, col.isPrimary, true, col.columnMeta?.columnType));
        }

        for (const itemExp of values) {
            const itemValue: Partial<TE> = {};
            for (const col of columns) {
                const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                itemValue[col.propertyName] = this.extractValue(valueExp as IExpression<TE[StringKeyOf<TE>]>, context);
                if (valueExp instanceof SqlParameterExpression) {
                    context.parameters.delete(valueExp);
                }
            }
            tvpValues.push(itemValue as TE);
        }

        context.parameters.set(tvpExp, { value: tvpValues });
        return tvpExp;
    }
    protected getTempTableQuery<TE extends object>(tvpExp: SqlTableValueParameterExpression<TE>, values: TE[], param?: IQueryBuilderContext): IQuery[] {
        const result: IQuery[] = [];
        result.push({
            query: `DROP TABLE IF EXISTS ${this.entityName(tvpExp)}`,
            type: QueryType.DDL
        });
        const columnDefinition = tvpExp.columns.map((c) => {
            const colTypeFactory = this.valueTypeMap.get(c.type);
            const maxValue = Enumerable.from(values).map((o) => (o[c.propertyName] as string)?.length).max();
            const colType = colTypeFactory(maxValue);
            return `${this.enclose(c.columnName)} ${this.columnTypeString(colType)}`;
        }).join("," + this.newLine(1, false));

        const query = `CREATE TEMPORARY TABLE ${this.entityName(tvpExp)}` +
            `${this.newLine()}(` +
            `${this.newLine(1, false)}${columnDefinition}` +
            `${this.newLine()})`;

        result.push({
            query,
            type: QueryType.DDL
        });

        let i = 0;
        const columns = tvpExp.columns;
        const insertQuery = new InsertExpression(tvpExp, [], columns);
        for (const item of values) {
            const itemExp: { [key: string]: IExpression } = {};
            for (const col of columns) {
                switch (col.propertyName) {
                    case "__index": {
                        itemExp[col.propertyName] = new ValueExpression(i++);
                        break;
                    }
                    case "__value": {
                        itemExp[col.propertyName] = new ValueExpression(item);
                        break;
                    }
                    default: {
                        const propVal = item[col.propertyName];
                        itemExp[col.propertyName] = new ValueExpression(isNotNull(propVal) ? propVal : null);
                        break;
                    }
                }
            }
            insertQuery.values.push(itemExp as SetterObj<TE>);
        }

        result.push(...this.getInsertQuery(insertQuery, param.option, param.parameters));

        for (const q of result) {
            q.type |= QueryType.ADDITIONAL;
        }

        return result;
    }
    protected toTableValueConstructorQuery<TE extends object>(entityExp: SqlTableValueParameterExpression<TE>, values: TE[], param?: IQueryBuilderContext): string {
        const columns = entityExp.columns.map(o => this.enclose(o.columnName)).join(", ");
        let i = 0;
        const valueLiterals = values.map(o => {
            const valueQuery = entityExp.columns.map(p => {
                const value = p.propertyName === "__index" ? i++ : o[p.propertyName];
                return this.valueString(value as ValueType);
            }).join(", ");
            return `(${valueQuery})`;
        }).join(`,${this.newLine(1, false)}`)
        return `(${this.newLine(1)}VALUES${this.newLine()}${valueLiterals}${this.newLine(-1)}) AS ${this.enclose(entityExp.alias)}(${columns})`;
    }
    protected getInsertQuery<TE extends object>(insertExp: InsertExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        if (insertExp.values.length <= 0) {
            return [];
        }

        const context = this.createContext(insertExp, parameters, option);
        const colString = Enumerable.from(insertExp.columns).map((o) => this.enclose(o.columnName)).reduce((acc, item) => acc ? acc + "," + item : item, "");
        const insertQuery = `INSERT INTO ${this.entityName(insertExp.entity)}${insertExp.entity.alias ? ` AS ${this.enclose(insertExp.entity.alias)}` : ""}(${colString}) VALUES`;
        let returning = "";
        if (insertExp.returnings.length) {
            returning = `${this.newLine()}RETURNING ${insertExp.returnings.map(o => {
                let colStr = this.getColumnQueryString(o, context);
                // NOTE: computed column should always has alias
                if (o.alias) {
                    colStr += " AS " + this.enclose(o.alias);
                }

                return colStr;
            }).join(",")}`;
        }

        this.indent++;
        let rowValues: string[] = [];
        // bulk insert
        for (const itemExp of insertExp.values) {
            const values: string[] = [];
            for (const col of insertExp.columns) {
                const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                if (valueExp) {
                    values.push(this.toString(valueExp, context));
                }
                else {
                    values.push("DEFAULT");
                }
            }

            rowValues.push(`(${values.join(",")})`);
        }
        const result: IQuery[] = [{
            query: `${insertQuery}${this.newLine()}${rowValues.join(`,${this.newLine()}`)}${returning}`,
            type: returning ? QueryType.DML | QueryType.DQL : QueryType.DML,
            parameters: this.getParameter(context)
        }];
        this.indent--;

        return result;
    }
    // TODO: Update Query use ANSI SQL Standard
    protected abstract getUpdateQuery<TE extends object>(updateExp: UpdateExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[];
    protected getUpsertQuery<TE extends object>(upsertExp: UpsertExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        if (upsertExp.values.length <= 0) {
            return [];
        }

        const joinString: string[] = [];

        const results: IQuery[] = [];
        const context = this.createContext(upsertExp, parameters, option);

        const tvpExp = this.createTVPExp("upsert", Enumerable.from(upsertExp.entity.primaryColumns).union(upsertExp.insertColumns, upsertExp.entity.columns.filter(o => o.propertyName in upsertExp.setter)), upsertExp.values, context);
        const targetAlias = upsertExp.entity.alias ?? "target";
        for (const o of upsertExp.entity.primaryColumns) {
            joinString.push(`${this.enclose(targetAlias)}.${this.enclose(o.columnName)} = ${this.enclose(tvpExp.alias)}.${this.enclose(o.columnName)}`);
        }
        let upsertQuery = `MERGE INTO ${this.entityName(upsertExp.entity)}${upsertExp.entity.alias ? ` AS ${this.enclose(upsertExp.entity.alias)}` : ""}` + this.newLine() +
            `USING ${this.getEntityQueryString(tvpExp, context)} ON ${joinString.join(" AND ")}` + this.newLine() +
            `WHEN MATCHED THEN` + this.newLine(1);

        const updateString = Enumerable.from(Object.keys(upsertExp.setter)).map((prop: StringKeyOf<TE>) => {
            const column = upsertExp.entity.columns.find(o => o.propertyName === prop);
            const valExp = upsertExp.setter[prop];
            const valStr = isNull(valExp) ? `${this.enclose(tvpExp.alias)}.${this.enclose(column.columnName)}` : this.toOperandString(valExp, context);
            return `${this.enclose(column.columnName)} = ${valStr}`;
        }).join(`,${this.newLine(1, false)}`);
        upsertQuery += this.newLine(1) + `UPDATE SET ${updateString}` + this.newLine(-1) +
            `WHEN NOT MATCHED THEN`;

        const colString = upsertExp.insertColumns.map((o) => this.enclose(o.columnName)).join(",");
        upsertQuery += this.newLine(1) + `INSERT (${colString})` + this.newLine() +
            `VALUES (${upsertExp.insertColumns.map((o) => `${this.enclose(tvpExp.alias)}.${this.enclose(o.columnName)}`).join(",")})` +
            this.newLine(-1);

        this.indent--;
        results.push({
            query: upsertQuery,
            type: QueryType.DML,
            parameters: this.getParameter(context)
        });

        if (upsertExp.returnings.length) {
            const selectExp = new SelectExpression(upsertExp.entity);
            selectExp.selects = upsertExp.returnings.slice(0);
            let relation: IExpression<boolean>;
            for (const column of selectExp.entity.primaryColumns) {
                const newValueColumn = new ColumnExpression(tvpExp, column.type, column.propertyName, column.columnName, false, true, column.columnMeta.columnType);
                tvpExp.columns.push(newValueColumn);
                const rel = new StrictEqualExpression(column, newValueColumn);
                relation = relation ? new AndExpression(relation, rel) : rel;
            }

            selectExp.paramExps.push(tvpExp);
            const valueSelectExp = new SelectExpression(tvpExp);
            valueSelectExp.selects = tvpExp.columns;
            valueSelectExp.isSubSelect = true;
            selectExp.addJoin(valueSelectExp, relation, "INNER");

            results.push(...this.getSelectQuery(selectExp, option, context.parameters));
        }

        return results;
    }
    protected getDeleteQuery<T extends object>(deleteExp: DeleteExpression<T>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        let result: IQuery[] = [];
        const context = this.createContext(deleteExp, parameters, option);

        const useTempTable = !option?.supportTVP && !deleteExp.parentRelation && deleteExp.includes.length;
        if (useTempTable) {
            for (const [key, valueExp] of parameters) {
                if (!(key instanceof SqlTableValueParameterExpression)) {
                    continue;
                }

                key.asTempTable = true;
                result.push(...this.getTempTableQuery(key, valueExp.value as unknown[], context));
            }
        }

        if (!deleteExp.entity.alias) {
            deleteExp.entity.alias = "d0";
        }

        const projectedEntity = new ProjectionEntityExpression(deleteExp.select);
        projectedEntity.alias = deleteExp.entity.alias + "_1";
        const selectExp = new SelectExpression(projectedEntity);
        selectExp.selects.length = 0;

        let pkFilter: IExpression<boolean>;
        for (const col of deleteExp.entity.primaryColumns) {
            const subCol = projectedEntity.primaryColumns.find(o => o.propertyName == col.propertyName);
            const exp = new StrictEqualExpression(subCol, col);
            pkFilter = pkFilter ? new AndExpression(pkFilter, exp) : exp;
        }
        selectExp.addWhere(pkFilter);
        const entityString = `${this.newLine(1)}${this.toSelectString(selectExp, context)}${this.newLine(-1)}`;

        let deleteQuery = `DELETE FROM ${this.entityName(deleteExp.entity)} AS ${this.enclose(deleteExp.entity.alias)}` +
            this.newLine() + `WHERE EXISTS(${entityString})`;
        result.push({
            query: deleteQuery,
            type: QueryType.DML,
            parameters: this.getParameter(context)
        });

        const includedDeletes = deleteExp.includes.flatMap((o) => this.getDeleteQuery(o.child, context.option, context.parameters));
        result.push(...includedDeletes);
        return result;
    }
    protected identifierString(value: Uuid): string {
        return this.stringString(value.toString());
    }
    protected isSimpleSelect(exp: SelectExpression) {
        return !(exp instanceof GroupByExpression) && !exp.where && exp.joins.length === 0
            && (!exp.parentRelation || exp.parentRelation instanceof JoinRelation && exp.parentRelation.childColumns.every((c) => exp.entity.columns.includes(c)))
            && !exp.paging.skip && !exp.paging.take
            && exp.selects.every((c) => !c.alias);
    }
    protected nullString() {
        return "NULL";
    }
    protected numberString(value: number) {
        if (!Number.isFinite(value)) {
            return this.nullString();
        }

        return value.toString();
    }
    protected bigIntString(value: bigint) {
        return value.toString();
    }
    protected stringString(value: string) {
        return "'" + value.replace(/'/ig, "''") + "'";
    }
    protected timeString(value: TimeSpan): string {
        return this.stringString(toTimeString(value));
    }

    //#endregion

    //#region IExpression
    protected toArrayString(expression: ArrayValueExpression<any>, param?: IQueryBuilderContext): string {
        const itemStr = expression.items.map((o) => this.toOperandString(o, param)).join(", ");
        return `(${itemStr})`;
    }
    protected toFunctionCallString(expression: FunctionCallExpression<any>, param?: IQueryBuilderContext): string {
        const fn = ExpressionExecutor.execute(expression.fnExpression);
        const transformer = this.resolveTranslator(fn);
        if (transformer) {
            return transformer.translate(this, expression, param);
        }

        throw new Error(`function "${expression.functionName}" not suported`);
    }
    protected toInstantiationString(expression: InstantiationExpression, param?: IQueryBuilderContext) {
        const translator = this.resolveTranslator(expression.type);
        if (!translator) {
            try {
                const value = ExpressionExecutor.execute(expression);
                return this.valueString(value as ValueType);
            } catch (e) {
                throw new Error(`instantiate "${expression.type.name}" not supported`);
            }
        }
        return translator.translate(this, expression, param);
    }
    protected toMemberAccessString(exp: MemberAccessExpression<any, any>, param?: IQueryBuilderContext): string {
        let translater: IQueryTranslatorItem;
        if (exp.objectOperand.type === Object && exp.objectOperand instanceof ValueExpression) {
            translater = this.resolveTranslator(exp.objectOperand.value, exp.memberName);
        }
        if (!translater && exp.objectOperand.type) {
            translater = this.resolveTranslator(exp.objectOperand.type.prototype, exp.memberName);
        }

        if (translater) {
            return translater.translate(this, exp, param);
        }
        throw new Error(`${exp.memberName} not supported.`);
    }
    protected toMethodCallString<TE, K extends MethodKey<TE>, T = MethodReturnType<TE, K>>(exp: MethodCallExpression<TE, K, T>, param?: IQueryBuilderContext): string {
        let translator: IQueryTranslatorItem;
        if (exp.objectOperand instanceof SelectExpression) {
            translator = this.resolveTranslator(SelectExpression.prototype, exp.methodName as any);
        }
        else if (exp.objectOperand instanceof SqlParameterExpression || exp.objectOperand instanceof ParameterExpression || exp.objectOperand instanceof ValueExpression) {
            const value = this.extractValue(exp.objectOperand, param);
            translator = this.resolveTranslator(value, exp.methodName);
        }

        if (!translator) {
            translator = this.resolveTranslator(exp.objectOperand.type.prototype, exp.methodName);
        }

        if (translator) {
            return translator.translate(this, exp, param);
        }

        throw new Error(`${(exp.objectOperand.type as any).name}.${exp.methodName} not supported in linq to sql.`);
    }
    protected toOperatorString(expression: IBinaryOperatorExpression, param?: IQueryBuilderContext) {
        const translator = this.resolveTranslator(expression.constructor);
        if (!translator) {
            throw new Error(`operator "${expression.constructor.name}" not supported`);
        }
        return translator.translate(this, expression, param);
    }
    protected toRawSqlString(expression: RawSqlExpression, param?: IQueryBuilderContext) {
        return expression.sqlStatement;
    }
    protected toSqlParameterString(expression: SqlParameterExpression, param?: IQueryBuilderContext): string {
        const paramValue = param.parameters.get(expression);
        if (!paramValue) {
            throw new Error(`Sql Parameter ${expression.toString()} no supported`);
        }

        return `:${paramValue.name}`;
    }
    protected toValueString(expression: ValueExpression<any>, param?: IQueryBuilderContext): string {
        if (expression.value === undefined && expression.expressionString) {
            return expression.expressionString;
        }

        return this.valueString(expression.value);
    }
    //#endregion
}
