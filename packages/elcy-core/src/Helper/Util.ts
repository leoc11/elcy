import { Decimal } from "src/Data/Decimal";
import { ArrayView, GenericType, IObjectType, PrimitiveType, ValueType } from "../Common/Type";
import { TimeSpan } from "../Data/TimeSpan";
import { IBinaryOperatorExpression } from "../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { IMemberOperatorExpression } from "../ExpressionBuilder/Expression/IMemberOperatorExpression";
import { IUnaryOperatorExpression } from "../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { TernaryExpression } from "../ExpressionBuilder/Expression/TernaryExpression";
import { GroupByExpression } from "../Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { IEntityExpression } from "../Queryable/QueryExpression/IEntityExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { Temporal } from "src/Data/Temporal";
import { IColumnMetaData } from "src/MetaData/Interface/IColumnMetaData";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { IRelationMetaData } from "src/MetaData/Interface/IRelationMetaData";
import { NullCoalesceExpression } from "src/ExpressionBuilder/Expression/NullCoalesceExpression";
import { ValueExpression } from "src/ExpressionBuilder/Expression/ValueExpression";
import { JoinRelation } from "src/Queryable/Interface/JoinRelation";
import { IMultiOperatorExpression } from "src/ExpressionBuilder/Expression/IMultiOperatorExpression";
import { Null } from "src/Common/Constant";

export const isIterable = (value: unknown): value is Iterable<any> => {
    return typeof (value as any)?.[Symbol.iterator] === 'function';
}
export const toHexaString = function (binary: ArrayBufferLike | ArrayView): string {
    if (ArrayBuffer.isView(binary)) {
        return toHexaString(binary.buffer);
    }

    let hexaString = Array.from(new Uint8Array(binary))
        .map((b) => {
            const a = b.toString(16);
            return a.length < 2 ? "0" + a : a;
        }).join("");
    if (!hexaString) {
        hexaString = "0";
    }
    return `0x${hexaString}`;
};
export const resolveClone = function <T extends IExpression>(exp: T, replaceMap: Map<IExpression, IExpression>): T {
    if (!exp) {
        return exp;
    }
    return (replaceMap.has(exp) ? replaceMap.get(exp) : exp.clone(replaceMap)) as T;
};
export const isEqual = function (a: any, b: any) {
    return a === b ||
        (
            isNotNull(a) && isNotNull(b)
            && a.constructor === b.constructor && a.hasOwnProperty(Symbol.toPrimitive)
            && b.hasOwnProperty(Symbol.toPrimitive) && a[Symbol.toPrimitive] === b[Symbol.toPrimitive]
        );
};
export function tryCreateInstance<T>(type: PrimitiveType<T>): T;
export function tryCreateInstance<T>(type: GenericType<T>): T;
export function tryCreateInstance<T>(type: GenericType<T>): T {
    switch (true) {
        case (type as GenericType<bigint>) === BigInt: {
            return 0n as T;
        }
        case Decimal && (type as GenericType<unknown>) === Decimal: {
            return new Decimal(0) as T;
        }
        case Temporal && (type as GenericType<unknown>) === Temporal.Instant: {
            return Temporal.Now.instant() as T;
        }
        case Temporal && (type as GenericType<unknown>) === Temporal.PlainDate: {
            return Temporal.Now.plainDateISO() as T;
        }
        case Temporal && (type as GenericType<unknown>) === Temporal.PlainTime: {
            return Temporal.Now.plainTimeISO() as T;
        }
        default: {
            try {
                return new (type as IObjectType<T>)();
            } catch { }
            try {
                return (type as () => T)();
            } catch { }

            return undefined;
        }
    }
}
export const mapReplaceExp = function (replaceMap: Map<IExpression, IExpression>, sourceExp: IExpression, targetExp: IExpression) {
    replaceMap.set(sourceExp, targetExp);
    if ((sourceExp as SelectExpression).projectedColumns && (targetExp as SelectExpression).projectedColumns) {
        const selectExp1 = sourceExp as SelectExpression;
        const selectExp2 = targetExp as SelectExpression;
        mapReplaceExp(replaceMap, selectExp1.entity, selectExp2.entity);
        if (isGroupExp(selectExp1) && isGroupExp(selectExp2)) {
            mapReplaceExp(replaceMap, selectExp1.key, selectExp2.key);
            mapReplaceExp(replaceMap, selectExp1.itemSelect, selectExp2.itemSelect);
        }
        const projectedCol = selectExp2.projectedColumns;
        for (const col of selectExp1.projectedColumns) {
            const tCol = projectedCol.find((o) => o.propertyName === col.propertyName);
            if (tCol) {
                replaceMap.set(col, tCol);
            }
        }
    }
    else if ((sourceExp as IEntityExpression).primaryColumns && (targetExp as IEntityExpression).primaryColumns) {
        const entityExp1 = sourceExp as IEntityExpression;
        const entityExp2 = targetExp as IEntityExpression;
        for (const col of entityExp1.columns) {
            const tCol = entityExp2.columns.find((o) => o.propertyName === col.propertyName);
            if (tCol) {
                replaceMap.set(col, tCol);
            }
        }
    }
};
export const mapKeepExp = function (replaceMap: Map<IExpression, IExpression>, exp: IExpression) {
    replaceMap.set(exp, exp);
    if ((exp as SelectExpression).projectedColumns) {
        const selectExp = exp as SelectExpression;
        mapKeepExp(replaceMap, selectExp.entity);
        if (isGroupExp(selectExp)) {
            mapKeepExp(replaceMap, selectExp.key);
            mapKeepExp(replaceMap, selectExp.itemSelect);
        }
        for (const o of selectExp.projectedColumns) {
            mapKeepExp(replaceMap, o);
        }
    }
    else if ((exp as IEntityExpression).primaryColumns) {
        const entityExp = exp as IEntityExpression;
        for (const o of entityExp.columns) {
            mapKeepExp(replaceMap, o);
        }
    }
};
export const removeExpFromMap = function (replaceMap: Map<IExpression, IExpression>, exp: IExpression) {
    replaceMap.delete(exp);
    if ((exp as SelectExpression).projectedColumns) {
        const selectExp = exp as SelectExpression;
        removeExpFromMap(replaceMap, selectExp.entity);
        if (isGroupExp(selectExp)) {
            removeExpFromMap(replaceMap, selectExp.key);
            removeExpFromMap(replaceMap, selectExp.itemSelect);
        }
        for (const o of selectExp.projectedColumns) {
            removeExpFromMap(replaceMap, o);
        }
    }
    else if ((exp as IEntityExpression).primaryColumns) {
        const entityExp = exp as IEntityExpression;
        for (const o of entityExp.columns) {
            removeExpFromMap(replaceMap, o);
        }
    }
};
export const visitExpression = <T extends IExpression>(source: IExpression, finder: (exp: IExpression) => boolean | void) => {
    if (finder(source) === false) {
        return;
    }

    if ((source as IBinaryOperatorExpression).rightOperand) {
        const binaryOperatorExp = source as IBinaryOperatorExpression;
        visitExpression(binaryOperatorExp.leftOperand, finder);
        visitExpression(binaryOperatorExp.rightOperand, finder);
    }
    else if (source instanceof TernaryExpression) {
        visitExpression(source.logicalOperand, finder);
        visitExpression(source.trueOperand, finder);
        visitExpression(source.falseOperand, finder);
    }
    else if ((source as IUnaryOperatorExpression).operand) {
        const unaryOperatorExp = source as IUnaryOperatorExpression;
        visitExpression(unaryOperatorExp.operand, finder);
    }
    else if ((source as IMultiOperatorExpression).operands) {
        const multiOperatorExp = source as IMultiOperatorExpression;
        for (const operand of multiOperatorExp.operands) {
            visitExpression(operand, finder);
        }
    }
    else if ((source as IMemberOperatorExpression).objectOperand) {
        const memberOperatorExp = source as IMemberOperatorExpression;
        visitExpression(memberOperatorExp.objectOperand, finder);
    }
};
export const replaceExpression = <T extends IExpression>(source: T, finder: <TEx extends IExpression>(exp: TEx) => TEx): T => {
    const rsource = finder(source);
    if (rsource !== source) {
        return rsource;
    }

    if ((source as unknown as IBinaryOperatorExpression).rightOperand) {
        const binaryOperatorExp = source as unknown as IBinaryOperatorExpression;
        binaryOperatorExp.leftOperand = replaceExpression(binaryOperatorExp.leftOperand, finder);
        binaryOperatorExp.rightOperand = replaceExpression(binaryOperatorExp.rightOperand, finder);
    }
    else if (source instanceof TernaryExpression) {
        source.logicalOperand = replaceExpression(source.logicalOperand, finder);
        source.trueOperand = replaceExpression(source.trueOperand, finder);
        source.falseOperand = replaceExpression(source.falseOperand, finder);
    }
    else if ((source as unknown as IUnaryOperatorExpression).operand) {
        const unaryOperatorExp = source as unknown as IUnaryOperatorExpression;
        unaryOperatorExp.operand = replaceExpression(unaryOperatorExp.operand, finder);
    }
    else if ((source as unknown as IMultiOperatorExpression).operands) {
        const multiOperatorExp = source as unknown as IMultiOperatorExpression;
        for (let i = 0, len = multiOperatorExp.operands.length; i < len; i++) {
            multiOperatorExp.operands[i] = replaceExpression(multiOperatorExp.operands[i], finder);
        }
    }
    else if ((source as unknown as IMemberOperatorExpression).objectOperand) {
        const memberOperatorExp = source as unknown as IMemberOperatorExpression;
        memberOperatorExp.objectOperand = replaceExpression(memberOperatorExp.objectOperand, finder);
    }
    return source;
};
export const isEntityExp = <T>(data: IExpression<T>): data is IEntityExpression<T & object> => {
    return !!(data as IEntityExpression<T & object>)?.entityTypes;
};
export const isExpression = (data: IExpression): data is IExpression => {
    return !!(data.type && data.hashCode && data.clone);
};
export const isGroupExp = (data: IExpression): data is GroupByExpression => {
    return !!(data as GroupByExpression).itemSelect;
};
export const isColumnExp = (data: IExpression): data is IColumnExpression => {
    return !!(data as IColumnExpression).entity;
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
    return entityMeta.columns.includes(data);
};
export const isRelationMetaData = <TE extends object>(entityMeta: IEntityMetaData<TE>, data: unknown): data is IRelationMetaData<TE> => {
    return entityMeta.relations.includes(data as IRelationMetaData<TE>);
};

const VALUE_TYPES = new Set<GenericType>();
export const isValueType = (type: GenericType) => {
    return type !== Null && VALUE_TYPES.has(type);
};
export const registerValueType = (type: GenericType) =>{
    VALUE_TYPES.add(type);
}
export const isNotNull = <T>(value: T | null | undefined): value is T => value != null;
export const isNull = (value: any): value is null => {
    return value == null;
};
const toString = Function.prototype.toString;
export const isNativeFunction = (fn: Function) => {
    return fn.toString().indexOf("=>") < 0 && toString.call(fn).includes("[native code]");
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
export const fillZero = (value: number, factor = 2): string => {
    const isNegative = value < 0;
    if (isNegative) {
        value = Math.abs(value);
    }
    let result = value + "";
    if (result.length < factor) {
        result = ("0").repeat(factor - result.length) + result;
    }
    return (isNegative ? "-" : "") + result;
};

const PRIME32_1 = 0x9E3779B1 >>> 0;
const PRIME32_2 = 0x85EBCA77 >>> 0;
const PRIME32_3 = 0xC2B2AE3D >>> 0;
const PRIME32_4 = 0x27D4EB2F >>> 0;
const PRIME32_5 = 0x165667B1 >>> 0;
const rotl = (x: number, r: number) => ((x << r) | (x >>> (32 - r))) >>> 0;
const get32 = (str: string, i: number) => str.charCodeAt(i)
    | (str.charCodeAt(i + 1) << 8)
    | (str.charCodeAt(i + 2) << 16)
    | (str.charCodeAt(i + 3) << 24);
/**
 * Use xxHash-like algo for string hash
 * @param str
 */
export const hashCode = (str: string, seed: number = 0) => {
    if (!str || str.length === 0) {
        return seed;
    }

    const len = str.length;
    let h32: number;
    let p = 0;

    if (len >= 16) {
        let v1 = (seed + PRIME32_1 + PRIME32_2) >>> 0;
        let v2 = (seed + PRIME32_2) >>> 0;
        let v3 = (seed + 0) >>> 0;
        let v4 = (seed - PRIME32_1) >>> 0;

        const limit = len - 16;
        while (p <= limit) {
            v1 = Math.imul(rotl(v1 + Math.imul(get32(str, p), PRIME32_2), 13), PRIME32_1) >>> 0;
            v2 = Math.imul(rotl(v2 + Math.imul(get32(str, p + 4), PRIME32_2), 13), PRIME32_1) >>> 0;
            v3 = Math.imul(rotl(v3 + Math.imul(get32(str, p + 8), PRIME32_2), 13), PRIME32_1) >>> 0;
            v4 = Math.imul(rotl(v4 + Math.imul(get32(str, p + 12), PRIME32_2), 13), PRIME32_1) >>> 0;
            p += 16;
        }

        h32 = (rotl(v1, 1) + rotl(v2, 7) + rotl(v3, 12) + rotl(v4, 18)) >>> 0;
    } else {
        h32 = (seed + PRIME32_5) >>> 0;
    }

    h32 = (h32 + len) >>> 0;

    // Tail: 4-byte chunks
    const limit = len - 4;
    while (p <= limit) {
        h32 = Math.imul(rotl(h32 + Math.imul(get32(str, p), PRIME32_3), 17), PRIME32_4) >>> 0;
        p += 4;
    }

    // Remaining 1–3 chars
    while (p < len) {
        h32 = Math.imul(rotl(h32 + Math.imul(str.charCodeAt(p++), PRIME32_5), 11), PRIME32_1) >>> 0;
    }

    // Final avalanche
    h32 ^= h32 >>> 15;
    h32 = Math.imul(h32, PRIME32_2) >>> 0;
    h32 ^= h32 >>> 13;
    h32 = Math.imul(h32, PRIME32_3) >>> 0;
    h32 ^= h32 >>> 16;

    return h32 >>> 0;
};
export const hashCodeAdd = (hash1: number, hash2: number) => {
    if (!hash1) return hash2;
    if (!hash2) return hash1;

    let h32 = Math.imul(rotl(hash1 + Math.imul(hash2, PRIME32_5) >>> 0, 13), PRIME32_1) >>> 0;

    // Final avalanche
    h32 ^= h32 >>> 15;
    h32 = Math.imul(h32, PRIME32_2) >>> 0;
    h32 ^= h32 >>> 13;
    h32 = Math.imul(h32, PRIME32_3) >>> 0;
    h32 ^= h32 >>> 16;

    return h32 >>> 0;
};

export const toDateTimeString = function (date: Date) {
    return date.getFullYear() + "-" + fillZero(date.getMonth() + 1) + "-" + fillZero(date.getDate()) + " " +
        fillZero(date.getHours()) + ":" + fillZero(date.getMinutes()) + ":" + fillZero(date.getSeconds()) + "." + fillZero(date.getMilliseconds(), 3);
};
export const toTimeString = function (time: TimeSpan) {
    return fillZero(time.getHours()) + ":" + fillZero(time.getMinutes()) + ":" + fillZero(time.getSeconds()) + "." + fillZero(time.getMilliseconds(), 3);
};
export const toDateString = function (date: Date) {
    return date.getFullYear() + "-" + fillZero(date.getMonth() + 1) + "-" + fillZero(date.getDate());
};
export const hasFlags = function (value: number, flag: number): boolean {
    return !!(value & flag);
};
export const arrayAdd = function <T>(array: T[], ...items: T[]) {
    for (const item of items) {
        if (!array.includes(item)) {
            array.push(item);
        }
    }
};
export const arrayDelete = function <T>(array: T[], ...items: T[]) {
    for (const item of items) {
        const index = array.indexOf(item);
        if (index >= 0) {
            array.splice(index, 1);
        }
    }
};
