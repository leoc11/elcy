import "reflect-metadata";
import { NullConstructor } from "../../Common/Constant";
import { QueryType } from "../../Common/Enum";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { INodeTree } from "../../Common/ParameterStack";
import { TimeZoneHandling } from "../../Common/StringType";
import { ArrayView, GenericType, ValueType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { IEnumerable } from "../../Enumerable/IEnumerable";
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
import { isColumnExp, isEntityExp, isNull, mapReplaceExp, toDateTimeString, toHexaString, toTimeString } from "../../Helper/Util";
import { DateTimeColumnMetaData } from "../../MetaData/DateTimeColumnMetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { TimeColumnMetaData } from "../../MetaData/TimeColumnMetaData";
import { DbFunction } from "../../Query/DbFunction";
import { IQueryBuilder } from "../../Query/IQueryBuilder";
import { IQueryBuilderParameter } from "../../Query/IQueryBuilderParameter";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryTemplate } from "../../Query/IQueryTemplate";
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
import { ProjectionEntityExpression } from "../../Queryable/QueryExpression/ProjectionEntityExpression";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { RawEntityExpression } from "../../Queryable/QueryExpression/RawEntityExpression";
import { RawSqlExpression } from "../../Queryable/QueryExpression/RawSqlExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { SqlParameterExpression } from "../../Queryable/QueryExpression/SqlParameterExpression";
import { SqlTableValueParameterExpression } from "../../Queryable/QueryExpression/SqlTableValueParameterExpression";
import { UnionExpression } from "../../Queryable/QueryExpression/UnionExpression";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { UpsertExpression } from "../../Queryable/QueryExpression/UpsertExpression";
import { relationalQueryTranslator } from "./RelationalQueryTranslator";

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
            if (!isNull(option.length) || !isNull(option.size)) {
                type += `(${option.length || option.size})`;
            }
            else if (!isNull(option.precision)) {
                type += !isNull(option.scale) ? `(${option.precision}, ${option.scale})` : `(${option.precision})`;
            }
        }
        return type;
    }
    public enclose(identity: string) {
        if (this.namingStrategy.enableEscape && identity && identity[0] !== "@" && identity[0] !== "#") {
            return "\"" + identity + "\"";
        }
        else {
            return identity;
        }
    }
    //#endregion

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
        if (isNull(input)) {
            return null;
        }
        let result = input;
        const type = column ? column.type : !isNull(input) ? input.constructor : NullConstructor;
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
        if (input === null && column.nullable) {
            return null;
        }
        switch (column.type as any) {
            case Boolean:
                result = Boolean(input);
                break;
            case Number:
                result = Number.parseFloat(input);
                if (!isFinite(result)) {
                    result = column.nullable ? null : 0;
                }
                break;
            case String:
                result = input ? input.toString() : input;
                break;
            case Date: {
                result = new Date(input);
                const timeZoneHandling: TimeZoneHandling = column instanceof DateTimeColumnMetaData ? column.timeZoneHandling : "none";
                if (timeZoneHandling !== "none") {
                    result = (result as Date).fromUTCDate();
                }
                break;
            }
            case TimeSpan: {
                result = typeof input === "number" ? new TimeSpan(input) : TimeSpan.parse(input);
                const timeZoneHandling: TimeZoneHandling = column instanceof TimeColumnMetaData ? column.timeZoneHandling : "none";
                if (timeZoneHandling !== "none") {
                    result = result.addMinutes(-(new Date(result.totalMilliSeconds())).getTimezoneOffset());
                }
                break;
            }
            case Uuid: {
                result = input ? new Uuid(input.toString()) : Uuid.empty;
                break;
            }
            case ArrayBuffer: {
                result = input.buffer ? input.buffer : input;
                break;
            }
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
                if (typeof input === "number") {
                    const dataView = new DataView(new ArrayBuffer(4));
                    dataView.setUint32(0, input);
                    input = dataView.buffer;
                }

                result = new (column.type as any)(input.buffer ? input.buffer : input);
                break;
            }
            default:
                throw new Error(`${column.type.name} not supported`);
        }
        return result;
    }

    //#region Query
    public toQuery<T>(queryExp: QueryExpression<T>, option?: IQueryOption): IQueryTemplate[] {
        let result: IQueryTemplate[] = [];

        if (queryExp instanceof SelectExpression) {
            result = this.getSelectQuery(queryExp, option);
        }
        else if (queryExp instanceof InsertIntoExpression) {
            result = this.getInsertIntoQuery(queryExp, option);
        }
        else if (queryExp instanceof InsertExpression) {
            result = this.getInsertQuery(queryExp, option);
        }
        else if (queryExp instanceof UpdateExpression) {
            result = this.getUpdateQuery(queryExp, option);
        }
        else if (queryExp instanceof UpsertExpression) {
            result = this.getUpsertQuery(queryExp, option);
        }
        else if (queryExp instanceof DeleteExpression) {
            result = this.getDeleteQuery(queryExp, option);
        }

        return result;
    }
    public toString<T = any>(expression: IExpression<T>, param?: IQueryBuilderParameter): string {
        let result = "";
        switch (expression.constructor) {
            case MemberAccessExpression:
                result = this.toMemberAccessString(expression as any, param);
                break;
            case MethodCallExpression:
                result = this.toMethodCallString(expression as any, param);
                break;
            case FunctionCallExpression:
                result = this.toFunctionCallString(expression as any, param);
                break;
            case SqlTableValueParameterExpression:
            case SqlParameterExpression:
                result = this.toSqlParameterString(expression as any, param);
                break;
            case ArrayValueExpression:
                result = this.toArrayString(expression as any, param);
                break;
            case ValueExpression:
                result = this.toValueString(expression as any);
                break;
            case InstantiationExpression:
                result = this.toInstantiationString(expression as any, param);
                break;
            case RawSqlExpression:
                result = this.toRawSqlString(expression as RawSqlExpression);
                break;
            default: {
                if (expression instanceof SelectExpression) {
                    return this.getSelectQueryString(expression, param) /*+ (expression.isSubSelect ? "" : ";")*/;
                }
                else if (isColumnExp(expression)) {
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
                throw new Error(`Expression ${expression.toString()} not supported`);
            }
        }
        return result;
    }
    //#endregion

    //#region Value

    public valueString(value: ValueType): string {
        if (!isNull(value)) {
            switch (value.constructor) {
                case Number:
                    return this.numberString(value as number);
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
                default:
                    throw new Error(`type "${value.constructor.name}" not supported`);
            }
        }
        return this.nullString();
    }
    public booleanString(value: boolean) {
        return value ? "1" : "0";
    }
    public dateTimeString(value: Date): string {
        return this.stringString(toDateTimeString(value));
    }
    public valueColumnType(value: ValueType) {
        const colTypeFactory = this.valueTypeMap.get(!isNull(value) ? value.constructor as any : String);
        return colTypeFactory(value);
    }

    //#endregion

    //#region refactor
    protected extractValue<T>(exp: IExpression<T>, param?: IQueryBuilderParameter): T {
        if (exp instanceof ValueExpression) {
            return exp.value;
        }
        // else if (exp instanceof SqlParameterExpression) {
        //     param.queryExpression.parameterTree.node;
        //     const takeParam = exp. param.parameters.get(exp);
        //     if (takeParam) {
        //         return takeParam.value as T;
        //     }
        // }
        return null;
    }
    protected getColumnQueryString(column: IColumnExpression, param?: IQueryBuilderParameter) {
        if (param && param.queryExpression) {
            if (param.queryExpression instanceof SelectExpression) {
                const commandExp = param.queryExpression;

                if (column.entity.alias === commandExp.entity.alias || (commandExp instanceof GroupByExpression && isEntityExp(commandExp.key) && commandExp.key.alias === column.entity.alias)) {
                    if (column instanceof ComputedColumnExpression && (param.state !== "column-declared" || !commandExp.resolvedSelects.contains(column))) {
                        return this.toOperandString(column.expression, param);
                    }
                    return this.enclose(column.entity.alias) + "." + this.enclose(column.columnName);
                }
                else {
                    let childSelect = commandExp.resolvedJoins.select((o) => o.child).first((selectExp) => selectExp.allSelects.any((o) => o.entity.alias === column.entity.alias));
                    if (!childSelect) {
                        childSelect = commandExp.parentRelation.parent;
                    }
                    const useAlias = !commandExp.selects.contains(column);
                    return this.enclose(childSelect.entity.alias) + "." + this.enclose(useAlias ? column.dataPropertyName : column.columnName);
                }
            }
            return this.enclose(column.entity.alias) + "." + this.enclose(column.dataPropertyName);
        }

        return this.enclose(column.dataPropertyName);
    }
    protected getDeleteQuery<T>(deleteExp: DeleteExpression<T>, option: IQueryOption): IQueryTemplate[] {
        let result: IQueryTemplate[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: deleteExp,
            option: option
        };

        let mode = deleteExp.mode;
        if (!mode) {
            mode = deleteExp.entity.deleteColumn ? "soft" : "hard";
        }
        else if (mode === "soft" && !deleteExp.entity.deleteColumn) {
            // if entity did not support soft delete, then abort.
            throw new Error(`'${deleteExp.entity.name}' did not support 'Soft' delete`);
        }

        if (mode === "soft") {
            // if soft delete, set delete column to true
            const set: { [key in keyof T]?: IExpression<T[key]> } = {};
            set[deleteExp.entity.deleteColumn.propertyName] = new ValueExpression(true) as any;
            const updateQuery = new UpdateExpression(deleteExp.select, set);
            result = this.getUpdateQuery(updateQuery, param.option);

            // apply delete option rule. coz soft delete delete option will not handled by db.
            const entityMeta: IEntityMetaData<T> = Reflect.getOwnMetadata(entityMetaKey, deleteExp.entity.type);
            const relations = entityMeta.relations.where((o) => o.isMaster);
            result = result.concat(relations.selectMany((o) => {
                const isManyToMany = o.completeRelationType === "many-many";
                const target = !isManyToMany ? o.target : o.relationData;
                const deleteOption = !isManyToMany ? o.reverseRelation.deleteOption : o.relationData.deleteOption;
                const relationColumns = !isManyToMany ? o.reverseRelation.relationColumns : o.relationData.source === entityMeta ? o.relationData.sourceRelationColumns : o.relationData.targetRelationColumns;
                const child = new SelectExpression(new EntityExpression(target.type, target.type.name));
                child.addJoin(deleteExp.select, o.reverseRelation, "INNER");
                // TODO: Handle this at join
                child.parameterTree = {
                    node: deleteExp.parameterTree.node.slice(),
                    childrens: deleteExp.parameterTree.childrens.slice()
                };
                switch (deleteOption) {
                    case "CASCADE": {
                        const childDelete = new DeleteExpression(child, deleteExp.mode);
                        if (childDelete.entity.deleteColumn && !param.option.includeSoftDeleted) {
                            childDelete.addWhere(new StrictEqualExpression(childDelete.entity.deleteColumn, new ValueExpression(false)));
                        }
                        return this.getDeleteQuery(childDelete, param.option);
                    }
                    case "SET NULL": {
                        const setOption: { [key: string]: IExpression<any> } = {};
                        for (const col of relationColumns) {
                            setOption[col.propertyName] = new ValueExpression(null);
                        }
                        const childUpdate = new UpdateExpression(child, setOption);
                        return this.getUpdateQuery(childUpdate, param.option);
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
                        return this.getUpdateQuery(childUpdate, param.option);
                    }
                    case "NO ACTION":
                    case "RESTRICT":
                    default:
                        return [];
                }
            }).toArray());
        }
        else {
            let deleteQueryStr = `DELETE ${this.enclose(deleteExp.entity.alias)}` +
                this.newLine() + `FROM ${this.entityName(deleteExp.entity)} AS ${this.enclose(deleteExp.entity.alias)}` +
                this.getJoinQueryString(deleteExp.joins, param);
            if (deleteExp.where) {
                deleteQueryStr += this.newLine() + "WHERE " + this.toLogicalString(deleteExp.where, param);
            }
            result.push({
                query: deleteQueryStr,
                type: QueryType.DML,
                parameterTree: deleteExp.parameterTree
            });
        }

        const clone = deleteExp.clone();

        const replaceMap = new Map();
        for (const col of deleteExp.entity.columns) {
            const cloneCol = clone.entity.columns.first((c) => c.columnName === col.columnName);
            replaceMap.set(col, cloneCol);
        }
        const includedDeletes = deleteExp.includes.selectMany((o) => {
            const child = o.child.clone();
            for (const col of o.child.entity.columns) {
                const cloneChildCol = child.entity.columns.first((c) => c.columnName === col.columnName);
                replaceMap.set(col, cloneChildCol);
            }
            const relations = o.relations.clone(replaceMap);
            child.addJoin(clone.select, relations, "INNER");
            if (clone.select.where) {
                child.addWhere(clone.select.where);
                clone.select.where = null;
            }
            return this.getDeleteQuery(child, param.option);
        }).toArray();
        result = result.concat(includedDeletes);
        return result;
    }
    protected getEntityQueryString(entity: IEntityExpression, param?: IQueryBuilderParameter): string {
        if (entity instanceof IntersectExpression) {
            return "(" + this.newLine(1) + this.getSelectQueryString(entity.subSelect, param) +
                this.newLine() + "INTERSECT" +
                this.newLine() + this.getSelectQueryString(entity.subSelect2, param) + this.newLine(-1) + ") AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof UnionExpression) {
            const unionAllExp = entity.isUnionAll as SqlParameterExpression<boolean>;
            const newUnionAllExp = new SqlParameterExpression(unionAllExp.name, new TernaryExpression(unionAllExp.valueExp, new ValueExpression(" ALL"), new ValueExpression("")));
            newUnionAllExp.isReplacer = true;
            param.queryExpression.replaceSqlParameter(unionAllExp, newUnionAllExp);

            return "(" + this.newLine(1) + this.getSelectQueryString(entity.subSelect, param) +
                this.newLine() + "UNION" + this.toString(newUnionAllExp) +
                this.newLine() + this.getSelectQueryString(entity.subSelect2, param) + this.newLine(-1) + ") AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof ExceptExpression) {
            return "(" + this.newLine(+1) + this.getSelectQueryString(entity.subSelect, param) +
                this.newLine() + "EXCEPT" +
                this.newLine() + this.getSelectQueryString(entity.subSelect2, param) + this.newLine(-1) + ") AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof ProjectionEntityExpression) {
            return this.getSelectQueryString(entity.subSelect, param) + " AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof RawEntityExpression) {
            return "(" + this.newLine(+1) + entity.definingQuery + this.newLine(-1) + ") AS " + this.enclose(entity.alias);
        }

        return this.entityName(entity) + (entity.alias ? " AS " + this.enclose(entity.alias) : "");
    }
    protected getInsertIntoQuery<T>(insertIntoExp: InsertIntoExpression<T>, option: IQueryOption): IQueryTemplate[] {
        const result: IQueryTemplate[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: insertIntoExp,
            option: option
        };

        const selectString = this.getSelectQueryString(insertIntoExp.select, param, true);
        const columns = insertIntoExp.columns.select((o) => this.enclose(o.columnName)).toArray().join(",");
        const selectQuery = `INSERT INTO ${this.entityName(insertIntoExp.entity)} (${columns})` + this.newLine() + selectString;
        result.push({
            query: selectQuery,
            type: QueryType.DML,
            parameterTree: insertIntoExp.parameterTree
        });

        return result;
    }
    protected getInsertQuery<T>(insertExp: InsertExpression<T>, option: IQueryOption): IQueryTemplate[] {
        if (insertExp.values.length <= 0) {
            return [];
        }

        const param: IQueryBuilderParameter = {
            queryExpression: insertExp,
            option: option
        };

        const colString = insertExp.columns.select((o) => this.enclose(o.columnName)).reduce("", (acc, item) => acc ? acc + "," + item : item);
        const insertQuery = `INSERT INTO ${this.entityName(insertExp.entity, param)}(${colString}) VALUES`;
        let queryTemplate: IQueryTemplate = {
            query: insertQuery,
            type: QueryType.DML,
            parameterTree: insertExp.parameterTree
        };
        const result: IQueryTemplate[] = [queryTemplate];
        let count = 0;
        this.indent++;
        for (const itemExp of insertExp.values) {
            const isLimitExceed = this.queryLimit.maxParameters && (count + insertExp.columns.length) > this.queryLimit.maxParameters;
            if (isLimitExceed) {
                queryTemplate.query = queryTemplate.query.slice(0, -1);
                queryTemplate = {
                    query: insertQuery,
                    type: QueryType.DML,
                    parameterTree: insertExp.parameterTree
                };
                count = 0;
                result.push(queryTemplate);
            }

            const values: string[] = [];
            for (const col of insertExp.columns) {
                const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                if (valueExp) {
                    values.push(this.toString(valueExp, param));
                    count++;
                }
                else {
                    values.push("DEFAULT");
                }
            }

            queryTemplate.query += `${this.newLine()}(${values.join(",")}),`;
        }
        this.indent--;
        queryTemplate.query = queryTemplate.query.slice(0, -1);

        return result;
    }
    protected entityName(entityExp: IEntityExpression, param?: IQueryBuilderParameter) {
        return this.enclose(entityExp.name);
    }
    protected getJoinQueryString<T>(joins: IEnumerable<JoinRelation<T, any>>, param?: IQueryBuilderParameter): string {
        let result = "";
        if (joins.any()) {
            result += this.newLine();
            result += joins.select((o) => {
                const childString = this.isSimpleSelect(o.child) ? this.getEntityQueryString(o.child.entity, param)
                    : "(" + this.newLine(1) + this.getSelectQueryString(o.child, param, true) + this.newLine(-1) + ") AS " + this.enclose(o.child.entity.alias);

                let joinStr = `${o.type} JOIN ${childString}`;
                if (o.relation) {
                    const joinString = this.toString(o.relation, param);
                    joinStr += this.newLine(1, false) + `ON ${joinString}`;
                }

                return joinStr;
            }).toArray().join(this.newLine());
        }
        return result;
    }
    protected getPagingQueryString(select: SelectExpression, take: IExpression<number>, skip: IExpression<number>): string {
        let result = "";
        if (take) {
            result += "LIMIT " + this.toString(take) + " ";
        }
        result += "OFFSET " + this.toString(skip);
        return result;
    }
    protected getParentJoinQueryString(parentRel: ISelectRelation, param?: IQueryBuilderParameter) {
        if (!(parentRel instanceof IncludeRelation)) {
            return "";
        }

        let parent = parentRel.parent;
        while (parent.parentRelation && parent.parentRelation.isEmbedded) {
            parent = parent.parentRelation.parent;
        }
        const entityString = this.isSimpleSelect(parent) ? this.getEntityQueryString(parent.entity, param) : `(${this.newLine(1)}${this.getSelectQueryString(parent, param, true)}${this.newLine(-1)}) AS ${this.enclose(parent.entity.alias)}`;
        const relationString = this.toLogicalString(parentRel.relation, param);
        return this.newLine() + `INNER JOIN ${entityString} ON ${relationString}`;
    }
    protected getSelectQuery<T>(selectExp: SelectExpression<T>, option: IQueryOption, skipInclude = false): IQueryTemplate[] {
        const result: IQueryTemplate[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: selectExp,
            option: option
        };

        // subselect should not have include
        if (selectExp.isSubSelect) {
            skipInclude = true;
        }

        const take = selectExp.paging.take as SqlParameterExpression;
        const skip = selectExp.paging.skip as SqlParameterExpression;
        if (take) take.isReplacer = true;
        if (skip) skip.isReplacer = true;

        const distinct = selectExp.distinct ? " DISTINCT" : "";
        const top = !skip && take ? " TOP " + this.toString(take) : "";

        const selects = selectExp.projectedColumns
            .select((o) => {
                let colStr = "";
                if (o instanceof ComputedColumnExpression) {
                    colStr = this.toOperandString(o.expression, param);
                }
                else {
                    colStr = this.enclose(o.entity.alias) + "." + this.enclose(o.columnName);
                }
                // NOTE: computed column should always has alias
                if (o.alias) {
                    colStr += " AS " + this.enclose(o.alias);
                }

                return colStr;
            })
            .toArray()
            .join("," + this.newLine(1, false));

        const entityQ = this.getEntityQueryString(selectExp.entity, param);

        if (selectExp instanceof GroupByExpression && !selectExp.isAggregate && selectExp.having && !selectExp.joins.ofType(HavingJoinRelation).any()) {
            const clone = selectExp.clone();
            clone.entity.alias = "rel_" + clone.entity.alias;
            clone.isAggregate = true;
            clone.distinct = true;
            clone.selects = clone.resolvedGroupBy.slice();

            let relation: IExpression<boolean>;
            for (const col of selectExp.resolvedGroupBy) {
                const cloneCol = clone.resolvedGroupBy.first((o) => o.dataPropertyName === col.dataPropertyName);
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
                selectQuerySuffix += this.newLine() + "GROUP BY " + selectExp.resolvedGroupBy.select((o) => this.getColumnQueryString(o, param)).toArray().join(", ");
            }
            if (selectExp.having) {
                selectQuerySuffix += this.newLine() + "HAVING " + this.toLogicalString(selectExp.having, param);
            }
        }

        if (selectExp.orders.length > 0 && (skip || take || !(selectExp.parentRelation instanceof JoinRelation))) {
            selectQuerySuffix += this.newLine() + "ORDER BY " + selectExp.orders.select((c) => this.toString(c.column, param) + " " + c.direction).toArray().join(", ");
        }

        if (skip) {
            selectQuerySuffix += this.newLine() + this.getPagingQueryString(selectExp, take, skip);
        }

        const selectQuery = `SELECT${distinct}${top} ${selects}`
            + this.newLine() + `FROM ${entityQ}${joinStr}${selectQuerySuffix}`;

        // select include before parent, coz result parser will parse include first before parent.
        // this way it will be much more easier to implement async iterator.
        const queryTemplate: IQueryTemplate = {
            query: selectQuery,
            type: QueryType.DQL,
            parameterTree: selectExp.parameterTree
        };
        result.push(queryTemplate);

        if (!skipInclude) {
            // select each include as separated query as it more beneficial for performance
            for (const include of selectExp.resolvedIncludes) {
                let child = include.child;
                if (include.isManyToManyRelation) {
                    // create relation data (clone select join clone child)
                    selectExp.includes.delete(include);
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
                        const bridgeCol = relationData.allColumns.first((o) => o.columnName === childCol.columnName);
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
                        let bridgeCol = relationData.allColumns.first((o) => o.columnName === parentCol.columnName);
                        if (!bridgeCol) {
                            bridgeCol = parentCol.clone(cloneMap);
                        }
                        relationData.selects.push(bridgeCol);
                        const logicalExp = new StrictEqualExpression(parentCol, bridgeCol);
                        parentBridgeRelation = parentBridgeRelation ? new AndExpression(parentBridgeRelation, logicalExp) : logicalExp;
                    }
                    selectExp.addInclude(include.name, relationData, parentBridgeRelation, "many");

                    child = relationData;
                }

                const templates = this.getSelectQuery(child, param.option);
                for (const temp of templates) {
                    temp.parameterTree = mergeTree(temp.parameterTree, queryTemplate.parameterTree);
                    result.push(temp);
                }
            }
        }
        return result;
    }

    protected getSelectQueryString(select: SelectExpression, param?: IQueryBuilderParameter, skipInclude = false): string {
        let result = "";
        result += this.getSelectQuery(select, param.option, skipInclude).select((o) => o.query).toArray().join(";" + this.newLine() + this.newLine());
        return result;
    }
    // TODO: Update Query should use ANSI SQL Standard
    protected getUpdateQuery<T>(updateExp: UpdateExpression<T>, option: IQueryOption): IQueryTemplate[] {
        const result: IQueryTemplate[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: updateExp,
            option: option
        };

        const setQuery = Object.keys(updateExp.setter).select((o: keyof T) => {
            const value = updateExp.setter[o];
            const valueStr = this.toOperandString(value, param);
            const column = updateExp.entity.columns.first((c) => c.propertyName === o);
            return `${this.enclose(column.columnName)} = ${valueStr}`;
        }).toArray();

        if (updateExp.entity.metaData) {
            if (updateExp.entity.metaData.modifiedDateColumn) {
                const colMeta = updateExp.entity.metaData.modifiedDateColumn;
                // only update modifiedDate column if not explicitly specified in update set statement.
                if (!updateExp.setter[colMeta.propertyName]) {
                    const valueExp = new MethodCallExpression(new ValueExpression(Date), colMeta.timeZoneHandling === "utc" ? "utcTimestamp" : "timestamp", []);
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
            parameterTree: updateExp.parameterTree
        });

        return result;
    }
    protected getUpsertQuery(upsertExp: UpsertExpression, option: IQueryOption): IQueryTemplate[] {
        const pkValues: string[] = [];
        const joinString: string[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: upsertExp,
            option: option
        };
        for (const o of upsertExp.entity.primaryColumns) {
            const valueExp = upsertExp.value[o.propertyName];
            pkValues.push(`${this.toString(valueExp, param)} AS ${this.enclose(o.columnName)}`);
            joinString.push(`_VAL.${this.enclose(o.columnName)} = ${this.getColumnQueryString(o, param)}`);
        }

        let upsertQuery = `MERGE INTO ${this.getEntityQueryString(upsertExp.entity, param)}` + this.newLine() +
            `USING (SELECT ${pkValues.join(", ")}) AS _VAL ON ${joinString.join(" AND ")}` + this.newLine() +
            `WHEN MATCHED THEN` + this.newLine(1);

        const updateString = upsertExp.updateColumns.select((column) => {
            const value = upsertExp.value[column.propertyName];
            if (!value) {
                return null;
            }

            return `${this.enclose(column.columnName)} = ${this.toOperandString(value, param)}`;
        }).where((o) => !!o).toArray().join(`,${this.newLine(1, false)}`);

        upsertQuery += `UPDATE SET ${updateString}` + this.newLine(-1) +
            `WHEN NOT MATCHED THEN` + this.newLine(1);

        const colString = upsertExp.insertColumns.select((o) => this.enclose(o.columnName)).toArray().join(",");
        const insertQuery = `INSERT (${colString})` + this.newLine() +
            `VALUES (${upsertExp.insertColumns.select((o) => {
                const valueExp = upsertExp.value[o.propertyName];
                return valueExp ? this.toString(valueExp, param) : "DEFAULT";
            }).toArray().join(",")})`;

        upsertQuery += insertQuery;
        this.indent--;

        const results: IQueryTemplate[] = [{
            query: upsertQuery,
            type: QueryType.DML,
            parameterTree: upsertExp.parameterTree
        }];
        return results;
    }
    protected identifierString(value: Uuid): string {
        return this.stringString(value.toString());
    }
    protected isSimpleSelect(exp: SelectExpression) {
        return !(exp instanceof GroupByExpression) && !exp.where && exp.joins.length === 0
            && (!exp.parentRelation || exp.parentRelation instanceof JoinRelation && exp.parentRelation.childColumns.all((c) => exp.entity.columns.contains(c)))
            && !exp.paging.skip && !exp.paging.take
            && exp.selects.all((c) => !c.alias);
    }
    protected nullString() {
        return "NULL";
    }
    protected numberString(value: number) {
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
        const itemStr = expression.items.select((o) => this.toOperandString(o, param)).toArray().join(", ");
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
        else if (/* exp.objectOperand instanceof SqlParameterExpression ||*/ exp.objectOperand instanceof ParameterExpression || exp.objectOperand instanceof ValueExpression) {
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
    protected toRawSqlString(expression: RawSqlExpression) {
        return expression.sqlStatement;
    }
    protected toSqlParameterString(expression: SqlParameterExpression, param?: IQueryBuilderParameter): string {
        if (expression.isReplacer) {
            return "${" + expression.name + "}";
        }
        return "@" + expression.name;
    }
    protected toValueString(expression: ValueExpression<any>): string {
        if (expression.value === undefined && expression.expressionString) {
            return expression.expressionString;
        }

        return this.valueString(expression.value);
    }

    //#endregion
}

const mergeTree = (tree1: INodeTree<SqlParameterExpression[]>, tree2: INodeTree<SqlParameterExpression[]>) => {
    const result: INodeTree<SqlParameterExpression[]> = {
        childrens: [],
        node: []
    };

    const list: Array<[INodeTree<SqlParameterExpression[]>, INodeTree<SqlParameterExpression[]>, INodeTree<SqlParameterExpression[]>]> = [[result, tree1, tree2]];
    while (list.any()) {
        const a = list.shift();
        a[0].node = [].concat(a[1] ? a[1].node : []).concat(a[2] ? a[2].node : []);

        for (let i = 0, len = Math.max(a[1] ? a[1].childrens.length : 0, a[2] ? a[2].childrens.length : 0); i < len; ++i) {
            const child1 = a[1] ? a[1].childrens[i] : null;
            const child2 = a[2] ? a[2].childrens[i] : null;
            const cresult = {
                childrens: [],
                node: []
            };
            a[0].childrens.push(cresult);
            list.push([cresult, child1, child2]);
        }
    }

    return result;
};
