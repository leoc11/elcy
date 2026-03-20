import { QueryType } from "../../Common/Enum";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { DeleteMode, TimeZoneHandling } from "../../Common/StringType";
import { ArrayView, GenericType, SetterObj, ValueType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { Enumerable, IEnumerable } from "@elcy/enumerable";
import { AdditionExpression } from "../../ExpressionBuilder/Expression/AdditionExpression";
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
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { TimeColumnMetaData } from "../../MetaData/TimeColumnMetaData";
import { BatchedQuery } from "../../Query/BatchedQuery";
import { DbFunction } from "../../Query/DbFunction";
import { IQuery } from "../../Query/IQuery";
import { IQueryBuilder } from "../../Query/IQueryBuilder";
import { IQueryBuilderParameter } from "../../Query/IQueryBuilderParameter";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryParameter, IQueryParameterMap } from "../../Query/IQueryParameter";
import { IQueryTranslatorItem } from "../../Query/IQueryTranslatorItem";
import { AliasType, NamingStrategy } from "../../Query/NamingStrategy";
import { HavingJoinRelation } from "../../Queryable/Interface/HavingJoinRelation";
import { IncludeRelation } from "../../Queryable/Interface/IncludeRelation";
import { ISelectRelation } from "../../Queryable/Interface/ISelectRelation";
import { JoinRelation } from "../../Queryable/Interface/JoinRelation";
import { ColumnExpression } from "../../Queryable/QueryExpression/ColumnExpression";
import { ComputedColumnExpression } from "../../Queryable/QueryExpression/ComputedColumnExpression";
import { DeleteExpression } from "../../Queryable/QueryExpression/DeleteExpression";
import { EntityExpression } from "../../Queryable/QueryExpression/EntityExpression";
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
import { SqlTableValueParameterExpression } from "../../Queryable/QueryExpression/SqlTableValueParameterExpression";
import { UnionExpression } from "../../Queryable/QueryExpression/UnionExpression";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { UpsertExpression } from "../../Queryable/QueryExpression/UpsertExpression";
import { relationalQueryTranslator } from "./RelationalQueryTranslator";
import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { getEntityMetadata } from "src/MetaData/MetaDataMapper";
import { RawEntityExpression } from "src/Queryable/QueryExpression/RawEntityExpression";
import { ConcatExpression } from "src/Queryable/QueryExpression/ConcatExpression";
import { Temporal } from "src/Data/Temporal";
import { Decimal } from "src/Data/Decimal";
import { SerializeColumnMetaData } from "src/MetaData/SerializeColumnMetaData";

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
    public abstract valueTypeMap: Map<GenericType, (value: unknown) => ICompleteColumnType>;

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
        if (requireEscape && identity[0] !== "@" && identity[0] !== "#") {
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
        let queryCommand: BatchedQuery = null;
        let paramCount = 0;
        for (const o of queries) {
            let isLimitExceed = true;
            if (queryCommand) {
                const qParamCount = o.parameters ? o.parameters.size : 0;
                isLimitExceed = this.queryLimit.maxBatchQuery && queryCommand.queryCount >= this.queryLimit.maxBatchQuery
                    || this.queryLimit.maxQueryLength && (queryCommand.query.length + o.query.length + 3) > this.queryLimit.maxQueryLength
                    || this.queryLimit.maxParameters && paramCount + qParamCount > this.queryLimit.maxParameters;
                if (isLimitExceed) {
                    paramCount = qParamCount;
                }
                else {
                    paramCount += qParamCount;
                }
            }

            if (isLimitExceed) {
                queryCommand = new BatchedQuery();
                result.push(queryCommand);
            }
            queryCommand.add(o);
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

    public resolveTranslator<T = any>(object: T, memberName?: keyof T) {
        return this.translator.resolve(object, memberName);
    }
    public toLogicalString(expression: IExpression<boolean>, param?: IQueryBuilderParameter) {
        if (isColumnExp(expression)) {
            expression = new EqualExpression(expression, new ValueExpression(true));
        }
        return this.toString(expression, param);
    }
    public toOperandString(expression: IExpression, param?: IQueryBuilderParameter): string {
        if (isEntityExp(expression)) {
            // TODO: dead code
            const column = expression.primaryColumns.length > 0 ? expression.primaryColumns[0] : expression.columns[0];
            return this.getColumnQueryString(column, param);
        }
        else if (expression.type === Boolean && !(expression instanceof ValueExpression) && !isColumnExp(expression)) {
            expression = new TernaryExpression(expression, new ValueExpression(true), new ValueExpression(false));
        }

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
    public toQuery<T>(queryExpression: IQueryExpression<T>, parameters?: IQueryParameterMap, option?: IQueryOption): IQuery[] {
        let result: IQuery[] = [];
        const tvps = new Map<SqlTableValueParameterExpression, IQueryParameter>();

        if (!(option && option.supportTVP)) {
            for (const [key, value] of parameters) {
                if (key instanceof SqlTableValueParameterExpression) {
                    tvps.set(key, value);
                    // NOTE: maybe TVP param should be deleted for unsupported db
                    // parameters.delete(key);
                }
            }
        }

        if (queryExpression instanceof SelectExpression) {
            result = this.getSelectQuery(queryExpression, option, parameters);
        }
        else if (queryExpression instanceof InsertIntoExpression) {
            result = this.getInsertIntoQuery(queryExpression, option, parameters);
        }
        else if (queryExpression instanceof InsertExpression) {
            result = this.getInsertQuery(queryExpression, option, parameters);
        }
        else if (queryExpression instanceof UpdateExpression) {
            result = this.getUpdateQuery(queryExpression, option, parameters);
        }
        else if (queryExpression instanceof UpsertExpression) {
            result = this.getUpsertQuery(queryExpression, option, parameters);
        }
        else if (queryExpression instanceof DeleteExpression) {
            result = this.getDeleteQuery(queryExpression, option, parameters);
        }

        if (tvps.size > 0) {
            let preQ: IQuery[] = [];
            const postQ: IQuery[] = [];
            for (const [tableValuExp, tvp] of tvps) {
                const entityExp = tableValuExp.entityExp;
                let i = 0;
                const arrayValues = tvp.value as any[];
                const columns = entityExp.columns;
                const insertQuery = new InsertExpression(entityExp, [], columns);
                for (const item of arrayValues) {
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
                    insertQuery.values.push(itemExp);
                }

                const createQ = this.getTempTableQuery(entityExp, arrayValues, option);
                const insertQ = this.getInsertQuery(insertQuery, option, new Map());

                preQ = preQ.concat(createQ).concat(insertQ);

                postQ.push({
                    query: `DROP TABLE ${this.enclose(entityExp.name)}`,
                    type: QueryType.DDL
                });
            }
            result = preQ.concat(result).concat(postQ);
        }
        return result;
    }
    public toString<T = any>(expression: IExpression<T>, param?: IQueryBuilderParameter): string {
        switch (true) {
            case expression instanceof MemberAccessExpression:
                return this.toMemberAccessString(expression, param);
            case expression instanceof MethodCallExpression:
                return this.toMethodCallString(expression, param);
            case expression instanceof FunctionCallExpression:
                return this.toFunctionCallString(expression, param);
            case expression instanceof SqlTableValueParameterExpression:
                return this.toSqlParameterString(expression as any, param);
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
                return this.getSelectQueryString(expression, param) /*+ (expression.isSubSelect ? "" : ";")*/;
            default: {
                if (isColumnExp(expression)) {
                    return this.getColumnQueryString(expression, param);
                }
                else if (isEntityExp(expression)) {
                    return this.getEntityQueryString(expression, param);
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
    protected extractValue<T>(exp: IExpression<T>, param?: IQueryBuilderParameter): T {
        if (exp instanceof ValueExpression) {
            return exp.value;
        }
        else if (exp instanceof SqlParameterExpression) {
            const takeParam = param.parameters.get(exp);
            if (takeParam) {
                return takeParam.value as T;
            }
        }
        return null;
    }
    protected getColumnQueryString(column: IColumnExpression, param?: IQueryBuilderParameter) {
        if (param && param.queryExpression) {
            if (param.queryExpression instanceof SelectExpression) {
                const commandExp = param.queryExpression;

                if (column.entity.alias === commandExp.entity.alias || (commandExp instanceof GroupByExpression && isEntityExp(commandExp.key) && commandExp.key.alias === column.entity.alias)) {
                    if (column instanceof ComputedColumnExpression && (param.state !== "column-declared" || !commandExp.resolvedSelects.includes(column))) {
                        return this.toOperandString(column.expression, param);
                    }
                    return this.enclose(column.entity.alias) + "." + this.enclose(column.columnName);
                }
                else {
                    let childSelect = commandExp.resolvedJoins.map((o) => o.child).find((selectExp) => selectExp.allSelects.some((o) => o.entity.alias === column.entity.alias));
                    if (!childSelect) {
                        childSelect = commandExp.parentRelation.parent;
                    }
                    const useAlias = !commandExp.projectedColumns.includes(column);
                    return this.enclose(childSelect.entity.alias) + "." + this.enclose(useAlias ? column.dataPropertyName : column.columnName);
                }
            }
            return this.enclose(column.entity.alias) + "." + this.enclose(column.dataPropertyName);
        }

        return this.enclose(column.dataPropertyName);
    }
    protected getDeleteQuery<T extends object>(deleteExp: DeleteExpression<T>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        let result: IQuery[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: deleteExp,
            parameters: parameters,
            option: option
        };

        let deleteStrategy: DeleteMode;
        if (deleteExp.deleteMode) {
            deleteStrategy = this.extractValue(deleteExp.deleteMode, param);
        }

        if (!deleteStrategy) {
            deleteStrategy = deleteExp.entity.deleteColumn ? "soft" : "hard";
        }
        else if (deleteStrategy === "soft" && !deleteExp.entity.deleteColumn) {
            // if entity did not support soft delete, then abort.
            throw new Error(`'${deleteExp.entity.name}' did not support 'Soft' delete`);
        }

        if (deleteStrategy === "soft") {
            // if soft delete, set delete column to true
            const set: SetterObj<T> = {};
            set[deleteExp.entity.deleteColumn.propertyName] = new ValueExpression(true) as any;
            const updateQuery = new UpdateExpression(deleteExp.select, set);
            result = this.getUpdateQuery(updateQuery, param.option, param.parameters);

            // apply delete option rule. coz soft delete delete option will not handled by db.
            const entityMeta: IEntityMetaData<T> = getEntityMetadata(deleteExp.entity.type);
            const relations = entityMeta.relations.filter((o) => o.isMaster);
            result = result.concat(relations.flatMap((o) => {
                if (o.completeRelationType === "many-many") {
                    throw new Error("many-many relation not supported");
                }

                const target = o.target;
                const deleteOption = o.reverseRelation.deleteOption;
                const relationColumns = o.reverseRelation.relationColumns;
                const child = new SelectExpression(new EntityExpression(target.type, target.type.name));
                child.addJoin(deleteExp.select, o.reverseRelation, "INNER");
                switch (deleteOption) {
                    case "CASCADE": {
                        const childDelete = new DeleteExpression(child, deleteExp.deleteMode);
                        if (childDelete.entity.deleteColumn && !param.option.includeSoftDeleted) {
                            childDelete.addWhere(new StrictEqualExpression(childDelete.entity.deleteColumn, new ValueExpression(false)));
                        }
                        return this.getDeleteQuery(childDelete, param.option, param.parameters);
                    }
                    case "SET NULL": {
                        const setOption: { [key: string]: IExpression<any> } = {};
                        for (const col of relationColumns) {
                            setOption[col.propertyName] = new ValueExpression(null);
                        }
                        const childUpdate = new UpdateExpression(child, setOption);
                        return this.getUpdateQuery(childUpdate, param.option, param.parameters);
                    }
                    case "SET DEFAULT": {
                        const setOption: { [key: string]: IExpression<any> } = {};
                        for (const col of o.reverseRelation.relationColumns) {
                            if (col.defaultExp) {
                                setOption[col.columnName] = col.defaultExp.body;
                            }
                            else {
                                setOption[col.columnName] = new ValueExpression(null);
                            }
                        }
                        const childUpdate = new UpdateExpression(child, setOption);
                        return this.getUpdateQuery(childUpdate, param.option, param.parameters);
                    }
                    case "NO ACTION":
                    case "RESTRICT":
                    default:
                        return [];
                }
            }));
        }
        else {
            let selectQuery = `DELETE ${this.enclose(deleteExp.entity.alias)}` +
                this.newLine() + `FROM ${this.entityName(deleteExp.entity)} AS ${this.enclose(deleteExp.entity.alias)}` +
                this.getJoinQueryString(deleteExp.joins, param);
            if (deleteExp.where) {
                selectQuery += this.newLine() + "WHERE " + this.toLogicalString(deleteExp.where, param);
            }
            result.push({
                query: selectQuery,
                type: QueryType.DML,
                parameters: this.getParameter(param)
            });
        }

        const clone = deleteExp.clone();

        const replaceMap = new Map();
        for (const col of deleteExp.entity.columns) {
            const cloneCol = clone.entity.columns.find((c) => c.columnName === col.columnName);
            replaceMap.set(col, cloneCol);
        }
        const includedDeletes = deleteExp.includes.flatMap((o) => {
            const child = o.child.clone();
            for (const col of o.child.entity.columns) {
                const cloneChildCol = child.entity.columns.find((c) => c.columnName === col.columnName);
                replaceMap.set(col, cloneChildCol);
            }
            const relations = o.relation.clone(replaceMap);
            child.addJoin(clone.select, relations, "INNER");
            if (clone.select.where) {
                child.addWhere(clone.select.where);
                clone.select.where = null;
            }
            return this.getDeleteQuery(child, param.option, param.parameters);
        });
        result = result.concat(includedDeletes);
        return result;
    }
    protected getEntityQueryString(entity: IEntityExpression, param?: IQueryBuilderParameter): string {
        let entityQ = "";
        if (entity instanceof UnionExpression) {
            entityQ = `(${this.newLine(1)}` +
                entity.subSelects.map(o => this.getSelectQueryString(o, param)).join(`${this.newLine()}UNION${this.newLine()}`) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof IntersectExpression) {
            entityQ = `(${this.newLine(1)}` +
                entity.subSelects.map(o => this.getSelectQueryString(o, param)).join(`${this.newLine()}INTERSECT${this.newLine()}`) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof ExceptExpression) {
            entityQ = `(${this.newLine(1)}` +
                entity.subSelects.map(o => this.getSelectQueryString(o, param)).join(`${this.newLine()}EXCEPT${this.newLine()}`) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof ConcatExpression) {
            entityQ = `(${this.newLine(1)}` +
                entity.subSelects.map(o => this.getSelectQueryString(o, param)).join(`${this.newLine()}UNION ALL${this.newLine()}`) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof ProjectionEntityExpression) {
            entityQ = this.getSelectQueryString(entity.subSelect, param);
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
    protected getInsertIntoQuery<T>(insertIntoExp: InsertIntoExpression<T>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        const result: IQuery[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: insertIntoExp,
            parameters: parameters,
            option: option
        };

        const selectString = this.getSelectQueryString(insertIntoExp.select, param, true);
        const columns = insertIntoExp.columns.map((o) => this.enclose(o.columnName)).join(",");
        const selectQuery = `INSERT INTO ${this.entityName(insertIntoExp.entity)} (${columns})` + this.newLine() + selectString;
        result.push({
            query: selectQuery,
            type: QueryType.DML,
            parameters: this.getParameter(param)
        });

        return result;
    }
    protected getInsertQuery<T extends object>(insertExp: InsertExpression<T>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        if (insertExp.values.length <= 0) {
            return [];
        }

        const param: IQueryBuilderParameter = {
            queryExpression: insertExp,
            parameters: parameters,
            option: option
        };

        const colString = Enumerable.from(insertExp.columns).map((o) => this.enclose(o.columnName)).reduce((acc, item) => acc ? acc + "," + item : item, "");
        const insertQuery = `INSERT INTO ${this.entityName(insertExp.entity)}(${colString}) VALUES`;
        let queryCommand: IQuery = {
            query: insertQuery,
            type: QueryType.DML,
            parameters: new Map()
        };
        const result: IQuery[] = [queryCommand];
        let count = 0;
        this.indent++;
        for (const itemExp of insertExp.values) {
            const isLimitExceed = this.queryLimit.maxParameters && (count + insertExp.columns.length) > this.queryLimit.maxParameters;
            if (isLimitExceed) {
                queryCommand.query = queryCommand.query.slice(0, -1);
                queryCommand = {
                    query: insertQuery,
                    type: QueryType.DML,
                    parameters: new Map()
                };
                count = 0;
                result.push(queryCommand);
            }

            const values: string[] = [];
            for (const col of insertExp.columns) {
                const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                if (valueExp) {
                    values.push(this.toString(valueExp, param));
                    const paramExp = param.parameters.get(valueExp);
                    if (paramExp) {
                        queryCommand.parameters.set(paramExp.name, paramExp.value);
                        count++;
                    }
                }
                else {
                    values.push("DEFAULT");
                }
            }

            queryCommand.query += `${this.newLine()}(${values.join(",")}),`;
        }
        this.indent--;
        queryCommand.query = queryCommand.query.slice(0, -1);

        if (insertExp.returnings.length) {
            queryCommand.query += `${this.newLine()}RETURNING ${insertExp.returnings.map(o => this.enclose(o.columnName)).join(",")}`
        }

        return result;
    }
    protected getJoinQueryString<T>(joins: IEnumerable<JoinRelation<T, any>>, param?: IQueryBuilderParameter): string {
        let result = "";
        if (joins.some(() => true)) {
            result += this.newLine();
            result += Enumerable.from(joins).map((o) => {
                const childString = this.isSimpleSelect(o.child) ? this.getEntityQueryString(o.child.entity, param)
                    : "(" + this.newLine(1) + this.getSelectQueryString(o.child, param, true) + this.newLine(-1) + ") AS " + this.enclose(o.child.entity.alias);

                let joinStr = `${o.type} JOIN ${childString}`;
                if (o.relation) {
                    joinStr += ` ON ${this.toString(o.relation, param)}`;
                }

                return joinStr;
            }).toArray().join(this.newLine());
        }
        return result;
    }
    protected getPagingQueryString(select: SelectExpression, param?: IQueryBuilderParameter): string {
        let result = "";
        if (select.orders.length <= 0) {
            if (select.distinct) {
                result += `${this.newLine()}ORDER BY ${this.toString(select.projectedColumns.find(o => true))}`;
            }
            else {
                result += `${this.newLine()}ORDER BY (SELECT NULL)`;
            }
        }
        if (select.paging.skip) {
            result += `${this.newLine()}OFFSET ${this.toString(select.paging.skip, param)} ROWS`;
        }
        if (select.paging.take) {
            result += `${this.newLine()}FETCH NEXT ${this.toString(select.paging.take, param)} ROWS ONLY`;
        }
        return result;
    }
    protected getParameter(param: IQueryBuilderParameter) {
        const paramObj = new Map<string, any>();
        const qparams = Enumerable.from(param.queryExpression.paramExps)
            .filter(o => !o.isSystem)
            .map((o) => param.parameters.get(o)).filter((o) => !!o);
        for (const o of qparams) {
            paramObj.set(o.name, o.value);
        }
        return paramObj;
    }
    protected getParentJoinQueryString<T>(parentRel: ISelectRelation, param?: IQueryBuilderParameter) {
        if (!(parentRel instanceof IncludeRelation)) {
            return "";
        }

        let parentRelation = parentRel;
        while (parentRelation) {
            ArrayExtension.add(parentRel.child.paramExps, ...parentRel.parent.paramExps);
            parentRelation = parentRelation.parent?.parentRelation;
        }

        let parent = parentRel.parent;
        while (parent.parentRelation && parent.parentRelation.isEmbedded) {
            parent = parent.parentRelation.parent;
        }
        const entityString = this.isSimpleSelect(parent) ? this.getEntityQueryString(parent.entity, param) : `(${this.newLine(1)}${this.getSelectQueryString(parent, param, true)}${this.newLine(-1)}) AS ${this.enclose(parent.entity.alias)}`;
        const relationString = this.toLogicalString(parentRel.relation, param);
        return this.newLine() + `INNER JOIN ${entityString} ON ${relationString}`;
    }
    protected getSelectQuery<T extends object>(selectExp: SelectExpression<T>, option: IQueryOption, parameters: IQueryParameterMap, skipInclude = false): IQuery[] {
        let result: IQuery[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: selectExp,
            parameters: parameters,
            option: option
        };
        // subselect should not have include
        if (selectExp.isSubSelect) {
            skipInclude = true;
        }

        const distinct = selectExp.distinct ? " DISTINCT" : "";
        const selects = Enumerable.from(selectExp.projectedColumns)
            .map((o) => {
                let colStr = this.getColumnQueryString(o, param);
                // NOTE: computed column should always has alias
                if (o.alias) {
                    colStr += " AS " + this.enclose(o.alias);
                }

                return colStr;
            })
            .toArray()
            .join("," + this.newLine(1, false));

        const entityQ = this.getEntityQueryString(selectExp.entity, param);

        if (selectExp instanceof GroupByExpression && !selectExp.isAggregate && selectExp.having && !Enumerable.from(selectExp.joins).ofType(HavingJoinRelation).some()) {
            const clone = selectExp.clone();
            clone.entity.alias = "rel_" + clone.entity.alias;
            clone.isAggregate = true;
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

        const joinStr = this.getJoinQueryString(selectExp.resolvedJoins, param) + this.getParentJoinQueryString(selectExp.parentRelation, param);

        let selectQuerySuffix = "";
        if (selectExp.where) {
            param.state = "column-declared";
            selectQuerySuffix += this.newLine() + "WHERE " + this.toLogicalString(selectExp.where, param);
            param.state = "";
        }

        if (selectExp instanceof GroupByExpression && selectExp.isAggregate) {
            if (selectExp.groupBy.length > 0) {
                selectQuerySuffix += this.newLine() + "GROUP BY " + selectExp.resolvedGroupBy.map((o) => this.getColumnQueryString(o, param)).join(", ");
            }
            if (selectExp.having) {
                selectQuerySuffix += this.newLine() + "HAVING " + this.toLogicalString(selectExp.having, param);
            }
        }

        const hasPagination = selectExp.paging.skip || selectExp.paging.take;
        if (selectExp.resolvedOrders.some(o => true) && (hasPagination || !(selectExp.parentRelation instanceof JoinRelation))) {
            selectQuerySuffix += this.newLine() + "ORDER BY " + selectExp.resolvedOrders.map((c) => this.toString(c.column, param) + " " + c.direction).join(", ");
        }

        if (hasPagination) {
            selectQuerySuffix += this.getPagingQueryString(selectExp, param);
        }

        const selectQuery = `SELECT${distinct} ${selects}`
            + this.newLine() + `FROM ${entityQ}${joinStr}${selectQuerySuffix}`;

        if (!skipInclude) {
            // select each include as separated query as it more beneficial for performance
            for (const include of selectExp.resolvedIncludes) {
                if (!include.isManyToManyRelation) {
                    result = result.concat(this.getSelectQuery(include.child, param.option, param.parameters));
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

                    result = result.concat(this.getSelectQuery(relationData, param.option, param.parameters));
                }
            }
        }

        // select include before parent, coz result parser will parse include first before parent.
        // this way it will be much more easier to implement async iterator.
        result.push({
            query: selectQuery,
            type: QueryType.DQL,
            parameters: this.getParameter(param)
        });
        return result;
    }

    protected getSelectQueryString(select: SelectExpression, param?: IQueryBuilderParameter, skipInclude = false): string {
        let result = "";
        result += this.getSelectQuery(select, param.option, param.parameters, skipInclude).map((o) => o.query).join(";" + this.newLine() + this.newLine());
        return result;
    }
    protected getTempTableQuery<T>(entityExp: IEntityExpression<T>, values: T[], option: IQueryOption): IQuery[] {
        const result: IQuery[] = [];
        const columnDefinition = entityExp.columns.map((c) => {
            const colTypeFactory = this.valueTypeMap.get(c.type);
            const maxValue = Enumerable.from(values).map((o) => o[c.propertyName]).max();
            const colType = colTypeFactory(maxValue);
            return `${this.enclose(c.columnName)} ${this.columnTypeString(colType)}`;
        }).join("," + this.newLine(1, false));

        const query = `CREATE TABLE ${entityExp.name}` +
            `${this.newLine()}(` +
            `${this.newLine(1, false)}${columnDefinition}` +
            `${this.newLine()})`;

        result.push({
            query,
            type: QueryType.DDL
        });
        return result;
    }
    // TODO: Update Query should use ANSI SQL Standard
    protected getUpdateQuery<T extends object>(updateExp: UpdateExpression<T>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        const result: IQuery[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: updateExp,
            parameters: parameters,
            option: option
        };

        const setQuery = Object.keys(updateExp.setter).map((o: keyof T) => {
            const value = updateExp.setter[o];
            const valueStr = this.toOperandString(value, param);
            const column = updateExp.entity.columns.find((c) => c.propertyName === o);
            return `${this.enclose(updateExp.entity.alias)}.${this.enclose(column.columnName)} = ${valueStr}`;
        });

        if (updateExp.entity.metaData) {
            if (updateExp.entity.metaData.modifiedDateColumn) {
                const colMeta = updateExp.entity.metaData.modifiedDateColumn;
                // only update modifiedDate column if not explicitly specified in update set statement.
                if (!updateExp.setter[colMeta.propertyName]) {
                    const valueExp = new MethodCallExpression(new ValueExpression(DbFunction), colMeta.timeZoneHandling === "utc" ? "utcTimestamp" : "timestamp", []);
                    const valueStr = this.toString(valueExp, param);
                    setQuery.push(`${this.enclose(updateExp.entity.alias)}.${this.enclose(colMeta.columnName)} = ${valueStr}`);
                }
            }

            if (updateExp.entity.metaData.versionColumn) {
                const colMeta = updateExp.entity.metaData.versionColumn;
                if (updateExp.setter[colMeta.propertyName]) {
                    throw new Error(`${colMeta.propertyName} is a version column and should not be update explicitly`);
                }

                const valueExp = new AdditionExpression(updateExp.entity.versionColumn, new ValueExpression(1));
                const valueStr = this.toString(valueExp, param);
                setQuery.push(`${this.enclose(updateExp.entity.alias)}.${this.enclose(colMeta.columnName)} = ${valueStr}`);
            }
        }

        let updateQuery = `UPDATE ${this.enclose(updateExp.entity.alias)}` +
            this.newLine() + `SET ${setQuery.join(", ")}` +
            this.newLine() + `FROM ${this.entityName(updateExp.entity)} AS ${this.enclose(updateExp.entity.alias)}` +
            this.getJoinQueryString(updateExp.joins, param);
        if (updateExp.where) {
            updateQuery += this.newLine() + "WHERE " + this.toLogicalString(updateExp.where, param);
        }

        result.push({
            query: updateQuery,
            type: QueryType.DML,
            parameters: this.getParameter(param)
        });

        return result;
    }
    protected getUpsertQuery(upsertExp: UpsertExpression, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        const pkValues: string[] = [];
        const joinString: string[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: upsertExp,
            parameters: parameters,
            option: option
        };
        for (const o of upsertExp.entity.primaryColumns) {
            const valueExp = upsertExp.setter[o.propertyName];
            pkValues.push(`${this.toString(valueExp, param)} AS ${this.enclose(o.columnName)}`);
            joinString.push(`_VAL.${this.enclose(o.columnName)} = ${this.getColumnQueryString(o, param)}`);
        }

        let upsertQuery = `MERGE INTO ${this.getEntityQueryString(upsertExp.entity, param)}` + this.newLine() +
            `USING (SELECT ${pkValues.join(", ")}) AS _VAL ON ${joinString.join(" AND ")}` + this.newLine() +
            `WHEN MATCHED THEN` + this.newLine(1);

        const updateString = Enumerable.from(upsertExp.updateColumns).map((column) => {
            const value = upsertExp.setter[column.propertyName];
            if (!value) {
                return null;
            }

            return `${this.enclose(column.columnName)} = ${this.toOperandString(value, param)}`;
        }).filter((o) => !!o).toArray().join(`,${this.newLine(1, false)}`);

        upsertQuery += `UPDATE SET ${updateString}` + this.newLine(-1) +
            `WHEN NOT MATCHED THEN` + this.newLine(1);

        const colString = upsertExp.insertColumns.map((o) => this.enclose(o.columnName)).join(",");
        const insertQuery = `INSERT (${colString})` + this.newLine() +
            `VALUES (${upsertExp.insertColumns.map((o) => {
                const valueExp = upsertExp.setter[o.propertyName];
                return valueExp ? this.toString(valueExp, param) : "DEFAULT";
            }).join(",")})`;

        upsertQuery += insertQuery;
        this.indent--;

        const paramObj = new Map<string, any>();
        for (const prop in upsertExp.setter) {
            const val = upsertExp.setter[prop] as SqlParameterExpression;
            const paramExp = param.parameters.get(val);
            if (paramExp) {
                paramObj.set(paramExp.name, paramExp.value);
            }
        }

        const results: IQuery[] = [{
            query: upsertQuery,
            type: QueryType.DML,
            parameters: paramObj
        }];
        return results;
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
    protected toArrayString(expression: ArrayValueExpression<any>, param?: IQueryBuilderParameter): string {
        const itemStr = expression.items.map((o) => this.toOperandString(o, param)).join(", ");
        return `(${itemStr})`;
    }
    protected toFunctionCallString(expression: FunctionCallExpression<any>, param?: IQueryBuilderParameter): string {
        const fn = ExpressionExecutor.execute(expression.fnExpression);
        const transformer = this.resolveTranslator(fn);
        if (transformer) {
            return transformer.translate(this, expression, param);
        }

        throw new Error(`function "${expression.functionName}" not suported`);
    }
    protected toInstantiationString(expression: InstantiationExpression, param?: IQueryBuilderParameter) {
        const translator = this.resolveTranslator(expression.type);
        if (!translator) {
            try {
                const value = ExpressionExecutor.execute(expression);
                return this.valueString(value);
            } catch (e) {
                throw new Error(`instantiate "${expression.type.name}" not supported`);
            }
        }
        return translator.translate(this, expression, param);
    }
    protected toMemberAccessString(exp: MemberAccessExpression<any, any>, param?: IQueryBuilderParameter): string {
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
    protected toMethodCallString<TType, KProp extends keyof TType, TResult = any>(exp: MethodCallExpression<TType, KProp, TResult>, param?: IQueryBuilderParameter): string {
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
    protected toOperatorString(expression: IBinaryOperatorExpression, param?: IQueryBuilderParameter) {
        const translator = this.resolveTranslator(expression.constructor);
        if (!translator) {
            throw new Error(`operator "${expression.constructor.name}" not supported`);
        }
        return translator.translate(this, expression, param);
    }
    protected toRawSqlString(expression: RawSqlExpression, param?: IQueryBuilderParameter) {
        return expression.sqlStatement;
    }
    protected toSqlParameterString(expression: SqlParameterExpression, param?: IQueryBuilderParameter): string {
        const paramValue = param.parameters.get(expression);
        if (!paramValue) {
            throw new Error(`Sql Parameter ${expression.toString()} no supported`);
        }

        return "@" + paramValue.name;
    }
    protected toValueString(expression: ValueExpression<any>, param?: IQueryBuilderParameter): string {
        if (expression.value === undefined && expression.expressionString) {
            return expression.expressionString;
        }

        return this.valueString(expression.value);
    }
    //#endregion
}
