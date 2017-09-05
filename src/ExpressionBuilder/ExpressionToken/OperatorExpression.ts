// const assigmentOperatorPriority = 0;
const logicalOperatorPriority = 2;
const comparisonOperatorPriority = 4;
const aritmaticSubAddOperatorPriority = 6;
const aritmaticPowOperatorPriority = 8;
const singleAritmaticOperatorPriority = 9;
const singleLogicalOperatorPriority = 9;
const memberAccessOperatorPriority = 10;

// + binary operator ~ >> << >>>
export class ExpressionOperator {
    constructor(readonly Symbol: string, readonly Priority: number) {
    }
}

export const AllExpressionOperators = [
    new ExpressionOperator("++", singleAritmaticOperatorPriority),
    new ExpressionOperator("--", singleAritmaticOperatorPriority),
    new ExpressionOperator("+", aritmaticSubAddOperatorPriority),
    new ExpressionOperator("-", aritmaticSubAddOperatorPriority),
    new ExpressionOperator("*", aritmaticPowOperatorPriority),
    new ExpressionOperator("/", aritmaticPowOperatorPriority),
    new ExpressionOperator("%", aritmaticPowOperatorPriority),
    // Comparison
    new ExpressionOperator("===", comparisonOperatorPriority),
    new ExpressionOperator("!==", comparisonOperatorPriority),
    new ExpressionOperator(">==", comparisonOperatorPriority),
    new ExpressionOperator("<==", comparisonOperatorPriority),
    new ExpressionOperator("==", comparisonOperatorPriority),
    new ExpressionOperator("!=", comparisonOperatorPriority),
    new ExpressionOperator(">=", comparisonOperatorPriority),
    new ExpressionOperator("<=", comparisonOperatorPriority),
    new ExpressionOperator("<", comparisonOperatorPriority),
    new ExpressionOperator(">", comparisonOperatorPriority),
    new ExpressionOperator("?", comparisonOperatorPriority),
    // Logical
    new ExpressionOperator("&&", logicalOperatorPriority),
    new ExpressionOperator("||", logicalOperatorPriority),
    new ExpressionOperator("&", logicalOperatorPriority),
    new ExpressionOperator("|", logicalOperatorPriority),
    new ExpressionOperator("!", singleLogicalOperatorPriority),
    // Member access
    new ExpressionOperator(".", memberAccessOperatorPriority)
];
