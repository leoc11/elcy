export enum Associativity {
    None = 0x0,
    Left = 0x1,
    Right = 0x2
}
export enum OperatorType {
    Unary = 0x0,
    Binary = 0x1,
    Ternary = 0x2
}
export enum UnaryPosition {
    Prefix = 0x0,
    Postfix = 0x1
}
export interface IOperator {
    precedence: number;
    associativity: Associativity;
    type: OperatorType;
}
export interface IUnaryOperator extends IOperator {
    position: UnaryPosition;
}
export const operators: Map<string, IOperator> = new Map([
    ["(", { precedence: 20, associativity: Associativity.None, type: OperatorType.Unary, position: UnaryPosition.Prefix }],
    [".", { precedence: 19, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["[", { precedence: 19, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["new", { precedence: 19, associativity: Associativity.None, type: OperatorType.Unary, position: UnaryPosition.Prefix }],
    ["function", { precedence: 19, associativity: Associativity.Left, type: OperatorType.Unary, position: UnaryPosition.Prefix }],
    // ["new", { precedence: 18, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix }],
    ["++", { precedence: 17, associativity: Associativity.None, type: OperatorType.Unary, position: UnaryPosition.Postfix } as IUnaryOperator],
    ["--", { precedence: 17, associativity: Associativity.None, type: OperatorType.Unary, position: UnaryPosition.Postfix } as IUnaryOperator],
    ["!", { precedence: 16, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix } as IUnaryOperator],
    ["~", { precedence: 16, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix } as IUnaryOperator],
    ["+", { precedence: 16, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix } as IUnaryOperator],
    ["-", { precedence: 16, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix } as IUnaryOperator],
    ["++", { precedence: 16, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix } as IUnaryOperator],
    ["--", { precedence: 16, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix } as IUnaryOperator],
    ["typeof", { precedence: 16, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix } as IUnaryOperator],
    ["void", { precedence: 16, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix } as IUnaryOperator],
    ["delete", { precedence: 16, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix } as IUnaryOperator],
    ["await", { precedence: 16, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix } as IUnaryOperator],
    ["**", { precedence: 15, associativity: Associativity.Right, type: OperatorType.Binary }],
    ["*", { precedence: 14, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["/", { precedence: 14, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["%", { precedence: 14, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["+", { precedence: 13, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["-", { precedence: 13, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["<<", { precedence: 12, associativity: Associativity.Left, type: OperatorType.Binary }],
    [">>", { precedence: 12, associativity: Associativity.Left, type: OperatorType.Binary }],
    [">>>", { precedence: 12, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["<", { precedence: 11, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["<=", { precedence: 11, associativity: Associativity.Left, type: OperatorType.Binary }],
    [">", { precedence: 11, associativity: Associativity.Left, type: OperatorType.Binary }],
    [">=", { precedence: 11, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["in", { precedence: 11, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["instanceof", { precedence: 11, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["==", { precedence: 10, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["!=", { precedence: 10, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["===", { precedence: 10, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["!==", { precedence: 10, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["&", { precedence: 9, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["^", { precedence: 8, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["|", { precedence: 7, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["&&", { precedence: 6, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["||", { precedence: 5, associativity: Associativity.Left, type: OperatorType.Binary }],
    ["?", { precedence: 4, associativity: Associativity.Right, type: OperatorType.Ternary }],
    ["=", { precedence: 3, associativity: Associativity.Right, type: OperatorType.Binary }],
    ["+=", { precedence: 3, associativity: Associativity.Right, type: OperatorType.Binary }],
    ["-=", { precedence: 3, associativity: Associativity.Right, type: OperatorType.Binary }],
    ["**=", { precedence: 3, associativity: Associativity.Right, type: OperatorType.Binary }],
    ["*=", { precedence: 3, associativity: Associativity.Right, type: OperatorType.Binary }],
    ["/=", { precedence: 3, associativity: Associativity.Right, type: OperatorType.Binary }],
    ["%=", { precedence: 3, associativity: Associativity.Right, type: OperatorType.Binary }],
    ["<<=", { precedence: 3, associativity: Associativity.Right, type: OperatorType.Binary }],
    [">>=", { precedence: 3, associativity: Associativity.Right, type: OperatorType.Binary }],
    [">>>=", { precedence: 3, associativity: Associativity.Right, type: OperatorType.Binary }],
    ["&=", { precedence: 3, associativity: Associativity.Right, type: OperatorType.Binary }],
    ["^=", { precedence: 3, associativity: Associativity.Right, type: OperatorType.Binary }],
    ["|=", { precedence: 3, associativity: Associativity.Right, type: OperatorType.Binary }],
    ["yield*", { precedence: 2, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix }],
    ["yield", { precedence: 2, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix }],
    [",", { precedence: 1, associativity: Associativity.Left, type: OperatorType.Binary }],
]);
