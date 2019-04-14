import { GenericType, ValueType } from "../Common/Type";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { IBinaryOperatorExpression } from "../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { TernaryExpression } from "../ExpressionBuilder/Expression/TernaryExpression";
import { IUnaryOperatorExpression } from "../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { TimeSpan } from "../Data/TimeSpan";
import { Uuid } from "../Data/Uuid";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { IEntityExpression } from "../Queryable/QueryExpression/IEntityExpression";
import { GroupByExpression } from "../Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { IMemberOperatorExpression } from "../ExpressionBuilder/Expression/IMemberOperatorExpression";
export type ArrayView = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | ArrayBufferView;
export const toHexaString = function (binary: ArrayBuffer | ArrayView): string {
    if (binary instanceof ArrayBuffer) {
        let hexaString = Array.from(new Uint8Array(binary))
            .map(b => {
                const a = b.toString(16);
                return a.length < 2 ? "0" + a : a;
            }).join("");
        if (!hexaString) hexaString = "0";
        return `0x${hexaString}`;
    }
    else {
        return toHexaString(binary.buffer);
    }
};
export const resolveClone = function <T extends IExpression>(exp: T, replaceMap: Map<IExpression, IExpression>): T {
    if (!exp) return exp;
    return (replaceMap.has(exp) ? replaceMap.get(exp) : exp.clone(replaceMap)) as T;
};
export const isEqual = function (a: any, b: any) {
    return a === b || (isNotNull(a) && isNotNull(b) && a.constructor === b.constructor && a.hasOwnProperty(Symbol.toPrimitive) && b.hasOwnProperty(Symbol.toPrimitive) && a[Symbol.toPrimitive] === b[Symbol.toPrimitive]);
};
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
            const tCol = projectedCol.first(o => o.propertyName === col.propertyName);
            if (tCol) replaceMap.set(col, tCol);
        }
    }
    else if ((sourceExp as IEntityExpression).primaryColumns && (targetExp as IEntityExpression).primaryColumns) {
        const entityExp1 = sourceExp as IEntityExpression;
        const entityExp2 = targetExp as IEntityExpression;
        for (const col of entityExp1.columns) {
            const tCol = entityExp2.columns.first(o => o.propertyName === col.propertyName);
            if (tCol) replaceMap.set(col, tCol);
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
        for (const o of selectExp.projectedColumns)
            mapKeepExp(replaceMap, o);
    }
    else if ((exp as IEntityExpression).primaryColumns) {
        const entityExp = exp as IEntityExpression;
        for (const o of entityExp.columns)
            mapKeepExp(replaceMap, o);
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
        for (const o of selectExp.projectedColumns)
            removeExpFromMap(replaceMap, o);
    }
    else if ((exp as IEntityExpression).primaryColumns) {
        const entityExp = exp as IEntityExpression;
        for (const o of entityExp.columns)
            removeExpFromMap(replaceMap, o);
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
    else if ((source as IMemberOperatorExpression).objectOperand) {
        const memberOperatorExp = source as IMemberOperatorExpression;
        visitExpression(memberOperatorExp.objectOperand, finder);
    }
};
export const replaceExpression = <T extends IExpression>(source: IExpression, finder: (exp: IExpression) => IExpression) => {
    const rsource = finder(source);
    if (rsource !== source) {
        return rsource;
    }

    if ((source as IBinaryOperatorExpression).rightOperand) {
        const binaryOperatorExp = source as IBinaryOperatorExpression;
        binaryOperatorExp.leftOperand = replaceExpression(binaryOperatorExp.leftOperand, finder);
        binaryOperatorExp.rightOperand = replaceExpression(binaryOperatorExp.rightOperand, finder);
    }
    else if (source instanceof TernaryExpression) {
        source.logicalOperand = replaceExpression(source.logicalOperand, finder);
        source.trueOperand = replaceExpression(source.trueOperand, finder);
        source.falseOperand = replaceExpression(source.falseOperand, finder);
    }
    else if ((source as IUnaryOperatorExpression).operand) {
        const unaryOperatorExp = source as IUnaryOperatorExpression;
        unaryOperatorExp.operand = replaceExpression(unaryOperatorExp.operand, finder);
    }
    else if ((source as IMemberOperatorExpression).objectOperand) {
        const memberOperatorExp = source as IMemberOperatorExpression;
        memberOperatorExp.objectOperand = replaceExpression(memberOperatorExp.objectOperand, finder);
    }
    return source;
};
export const isEntityExp = (data: IExpression): data is IEntityExpression => {
    return !!(data as IEntityExpression).entityTypes;
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
export const isValue = (data: any): data is ValueType => {
    return isNotNull(data) && isValueType(data.constructor);
};
export const isValueType = (type: GenericType) => {
    switch (type) {
        case Number:
        case String:
        case Date:
        case TimeSpan:
        case Uuid:
        case Boolean:
        case ArrayBuffer:
        // TypedArray
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
            return true;
        default:
            return false;
    }
};
export const isNotNull = (value: any) => {
    return value !== null && value !== undefined;
};
export const isNativeFunction = (fn: Function) => {
    return fn.toString().indexOf("=>") < 0 && !("prototype" in fn);
};
export const clone = <T>(source: T, isDeep = false) => {
    const res: T = {} as any;
    for (const prop in source) {
        let val = source[prop];
        if (isDeep && val && val.constructor === Object)
            val = clone(val, isDeep);
        res[prop] = val;
    }
    return res;
};
export const fillZero = (value: number, factor = 2): string => {
    const isNegative = value < 0;
    if (isNegative) value = Math.abs(value);
    return (isNegative ? "-" : "") + (("0").repeat(factor - 1) + value).slice(-factor);
};
/**
 * 
 * @param str source: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
export const hashCode = (str: string, hash: number = 0) => {
    if (!str || str.length === 0)
        return hash;
    for (let i = 0, len = str.length; i < len; i++) {
        hash = hashCodeAdd(hash, str.charCodeAt(i));
    }
    return hash;
};
export const hashCodeAdd = (hash: number, add: number) => {
    hash = ((hash << 5) - hash) + add;
    hash |= 0;
    return hash;
};

export const toJSON = function <T>(this: T) {
    const proto = this.constructor.prototype;
    const jsonObj: any = {};
    Object.keys(this).union(Object.keys(proto)).each((o: keyof T) => {
        jsonObj[o] = this[o];
    });
    return jsonObj;
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