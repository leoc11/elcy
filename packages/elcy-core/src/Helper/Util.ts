import { ArrayView, GenericType, ValueType } from "../Common/Type";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { GroupByExpression } from "../Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { IEntityExpression } from "../Queryable/QueryExpression/IEntityExpression";
import { IColumnMetaData } from "src/MetaData/Interface/IColumnMetaData";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { IRelationMetaData } from "src/MetaData/Interface/IRelationMetaData";
import { NullCoalesceExpression } from "src/ExpressionBuilder/Expression/NullCoalesceExpression";
import { ValueExpression } from "src/ExpressionBuilder/Expression/ValueExpression";
import { JoinRelation } from "src/Queryable/Interface/JoinRelation";  // TODO: COLDSTART
import { Null } from "src/Common/Constant";
import { VALUE_TYPES } from "./Type";
import { SelectExpression } from "src/Queryable/QueryExpression/SelectExpression";
import { IBinaryOperatorExpression } from "src/ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { IUnaryOperatorExpression } from "src/ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { IMultiOperatorExpression } from "src/ExpressionBuilder/Expression/IMultiOperatorExpression";
import { JoinType } from "src/Common/StringType";

export const isIterable = (value: unknown): value is Iterable<any> => {
    return typeof (value as any)?.[Symbol.iterator] === 'function';
}
export const isEqual = function (a: any, b: any) {
    return a === b ||
        (
            isNotNull(a) && isNotNull(b)
            && a.constructor === b.constructor && a.hasOwnProperty(Symbol.toPrimitive)
            && b.hasOwnProperty(Symbol.toPrimitive) && a[Symbol.toPrimitive]() === b[Symbol.toPrimitive]()
        );
};
export const isEntityExp = <T = any>(data: unknown): data is IEntityExpression<T> => {
    return Boolean((data as IEntityExpression)?.entityTypes);
};
export const isExpression = (data: unknown): data is IExpression => {
    const dataEx = data as IExpression;
    return !!(dataEx.type && dataEx.hashCode && dataEx.clone);
};
export const isSelectExp = <TE = unknown>(exp: unknown): exp is SelectExpression<TE> => {
    return exp instanceof SelectExpression;
}
export const isGroupExp = (data: IExpression): data is GroupByExpression => {
    return !!(data as GroupByExpression).itemSelect;
};
export const isBinaryExp = <T = unknown>(exp: unknown): exp is IBinaryOperatorExpression<T> => {
    return Boolean((exp as IBinaryOperatorExpression)?.leftOperand);
};
export const isUnaryExp = <T = unknown>(exp: unknown): exp is IUnaryOperatorExpression<T> => {
    return Boolean((exp as IUnaryOperatorExpression)?.operand);
};
export const isMultiExp = <T = unknown>(exp: unknown): exp is IMultiOperatorExpression<T> => {
    return Boolean((exp as IMultiOperatorExpression)?.operands?.length);
};
export const isColumnExp = <TE = any, T = ValueType>(data: unknown): data is IColumnExpression<TE, T> => {
    return !!(data as IColumnExpression).entity;
};
export const isColumnMeta = <TE extends object = object, T = ValueType>(data: unknown): data is IColumnMetaData<TE, T> => {
    return isEntityMeta((data as IColumnMetaData).entity);
};
export const isEntityMeta = (data: unknown): data is IEntityMetaData => {
    return Boolean((data as IEntityMetaData).properties && (data as IEntityMetaData).name);
};
export const isNonNullExp = (data: IExpression): boolean => {
    if (isColumnExp(data)) {
        const parentRel = data.entity.select?.parentRelation;
        if (parentRel instanceof JoinRelation && (parentRel.type === "LEFT" || parentRel.type === "FULL")) {
            return false;
        }

        return data.isNullable !== true;
    }
    if (data instanceof ValueExpression) {
        return !isNull(data.value);
    }
    if (data instanceof NullCoalesceExpression) {
        return isNonNullExp(data.rightOperand);
    }

    return false;
};
export const isValue = (data: any): data is ValueType => {
    return isNotNull(data) && isValueType(data.constructor);
};
export const isColumnMetaData = <TE extends object>(entityMeta: IEntityMetaData<TE>, data: unknown): data is IColumnMetaData<TE> => {
    return (data as IColumnMetaData<TE>).entity === entityMeta;
};
export const isRelationMetaData = <TE extends object>(entityMeta: IEntityMetaData<TE>, data: unknown): data is IRelationMetaData<TE> => {
    return entityMeta.relations.includes(data as IRelationMetaData<TE>);
};

export const isValueType = (type: GenericType) => {
    return type !== Null && VALUE_TYPES.has(type);
};
export const isNotNull = <T>(value: T | null | undefined): value is T => value != null;
export const isNull = (value: any): value is null => value == null;
const toString = Function.prototype.toString;
export const isNativeFunction = (fn: Function) => {
    const fnString = toString.call(fn);
    return fnString.indexOf("=>") < 0 && fnString.includes("[native code]");
};
export const reverseJoinType = (joinType: JoinType): JoinType => {
    switch (joinType) {
        case "LEFT": return "INNER";
        case "INNER": return "INNER";
        case "RIGHT": return "LEFT";
        case "FULL": return "FULL";
        case "CROSS": return "CROSS";
    }
}
export const toHexaString = function (binary: ArrayBufferLike | ArrayView): string {
    let bytes: Uint8Array;
    if (!ArrayBuffer.isView(binary)) {
        bytes = new Uint8Array(binary);
    }
    else if (binary instanceof Uint8Array) {
        bytes = binary;
    }
    else {
        bytes = new Uint8Array(binary.buffer, binary.byteOffset, binary.byteLength);
    }

    let hexaString = "";
    for (let i = 0, len = bytes.length; i < len; i++) {
        const a = bytes[i].toString(16);
        hexaString += a.length < 2 ? "0" + a : a;
    }
    if (!hexaString) {
        hexaString = "0";
    }
    return `0x${hexaString}`;
};

export const fillZero = (value: number, length = 2): string => {
    return value?.toString().padStart(length, "0");
};

export const toDateTimeString = function (date: Date) {
    return date.getFullYear() + "-" + fillZero(date.getMonth() + 1) + "-" + fillZero(date.getDate()) + " " +
        fillZero(date.getHours()) + ":" + fillZero(date.getMinutes()) + ":" + fillZero(date.getSeconds()) + "." + fillZero(date.getMilliseconds(), 3);
};
export const clone = <T>(source: T, isDeep = false) => {
    if (!source) return source;

    const res: T = {} as any;
    for (const prop in source) {
        let val = source[prop];
        if (isDeep && val && val.constructor === Object) {
            val = clone(val, isDeep);
        }
        res[prop] = val;
    }
    return res;
};
