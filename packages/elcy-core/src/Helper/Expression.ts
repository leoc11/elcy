import type { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import type { IEntityExpression } from "src/Queryable/QueryExpression/IEntityExpression";
import type { SelectExpression } from "src/Queryable/QueryExpression/SelectExpression";
import { isGroupExp } from "./Util";
import type { IBinaryOperatorExpression } from "src/ExpressionBuilder/Expression/IBinaryOperatorExpression";
import type { IMemberOperatorExpression } from "src/ExpressionBuilder/Expression/IMemberOperatorExpression";
import type { IMultiOperatorExpression } from "src/ExpressionBuilder/Expression/IMultiOperatorExpression";
import type { IUnaryOperatorExpression } from "src/ExpressionBuilder/Expression/IUnaryOperatorExpression";
import type { TernaryExpression } from "src/ExpressionBuilder/Expression/TernaryExpression";

export const resolveClone = function <T extends IExpression>(exp: T, replaceMap: Map<IExpression, IExpression>): T {
    if (!exp) {
        return exp;
    }
    return (replaceMap.has(exp) ? replaceMap.get(exp) : exp.clone(replaceMap)) as T;
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
            const tCol = projectedCol.find((o) => o.propertyName === col.propertyName);
            if (tCol) {
                replaceMap.set(col, tCol);
            }
        }
    }
    else if ((sourceExp as IEntityExpression).primaryColumns && (targetExp as IEntityExpression).primaryColumns) {
        const entityExp1 = sourceExp as IEntityExpression;
        const entityExp2 = targetExp as IEntityExpression;
        for (const propertyKey in entityExp1.properties) {
            const tCol = entityExp2.properties[propertyKey];
            if (tCol) {
                const col = entityExp1.properties[propertyKey];
                replaceMap.set(col, tCol);
            }
        }
    }
};export const mapKeepExp = function (replaceMap: Map<IExpression, IExpression>, exp: IExpression) {
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
        for (const propertyKey in entityExp.properties) {
            mapKeepExp(replaceMap, entityExp.properties[propertyKey]);
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
        for (const propertyKey in entityExp.properties) {
            removeExpFromMap(replaceMap, entityExp.properties[propertyKey]);
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
    else if ((source as TernaryExpression).logicalOperand) {
        const ternaryExp = source as TernaryExpression;
        visitExpression(ternaryExp.logicalOperand, finder);
        visitExpression(ternaryExp.trueOperand, finder);
        visitExpression(ternaryExp.falseOperand, finder);
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
    else if ((source as unknown as TernaryExpression).logicalOperand) {
        const ternaryExp = source as unknown as TernaryExpression;
        ternaryExp.logicalOperand = replaceExpression(ternaryExp.logicalOperand, finder);
        ternaryExp.trueOperand = replaceExpression(ternaryExp.trueOperand, finder);
        ternaryExp.falseOperand = replaceExpression(ternaryExp.falseOperand, finder);
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

