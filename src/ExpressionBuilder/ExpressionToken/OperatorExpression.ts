// const assigmentOperatorPriority = 0;
const logicalOperatorPriority = 2;
const comparisonOperatorPriority = 4;
const aritmaticSubAddOperatorPriority = 6;
const aritmaticPowOperatorPriority = 8;
const singleAritmaticOperatorPriority = 9;
const singleLogicalOperatorPriority = 9;
const memberAccessOperatorPriority = 10;

export class OperatorExpression {
    constructor(readonly Symbol: string, readonly Priority: number) {
    }
}

export const AllOperatorExpressions = [
    new OperatorExpression("++", singleAritmaticOperatorPriority),
    new OperatorExpression("--", singleAritmaticOperatorPriority),
    new OperatorExpression("+", aritmaticSubAddOperatorPriority),
    new OperatorExpression("-", aritmaticSubAddOperatorPriority),
    new OperatorExpression("*", aritmaticPowOperatorPriority),
    new OperatorExpression("/", aritmaticPowOperatorPriority),
    new OperatorExpression("%", aritmaticPowOperatorPriority),
    // Comparison
    new OperatorExpression("===", comparisonOperatorPriority),
    new OperatorExpression("!==", comparisonOperatorPriority),
    new OperatorExpression(">==", comparisonOperatorPriority),
    new OperatorExpression("<==", comparisonOperatorPriority),
    new OperatorExpression("==", comparisonOperatorPriority),
    new OperatorExpression("!=", comparisonOperatorPriority),
    new OperatorExpression(">=", comparisonOperatorPriority),
    new OperatorExpression("<=", comparisonOperatorPriority),
    new OperatorExpression("<", comparisonOperatorPriority),
    new OperatorExpression(">", comparisonOperatorPriority),
    new OperatorExpression("?", comparisonOperatorPriority),
    // Logical
    new OperatorExpression("&&", logicalOperatorPriority),
    new OperatorExpression("||", logicalOperatorPriority),
    new OperatorExpression("&", logicalOperatorPriority),
    new OperatorExpression("|", logicalOperatorPriority),
    new OperatorExpression("!", singleLogicalOperatorPriority),
    // Member access
    new OperatorExpression(".", memberAccessOperatorPriority)
];
