import { IExpression } from "./Expression";

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
export interface IOperatorPrecedence {
    precedence: number;
    associativity: Associativity;
}
export interface IOperator {
    precedence: IOperatorPrecedence;
    identifier: string;
    type: OperatorType;
    expressionFactory?: (...params: any[]) => IExpression;
}
export interface IUnaryOperator extends IOperator {
    position: UnaryPosition;
}
export const operators: IOperator[] = [
    <IUnaryOperator>{ identifier: "(", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 20, associativity: Associativity.None } },
    { identifier: ".", type: OperatorType.Binary, precedence: { precedence: 19, associativity: Associativity.Left } },
    { identifier: "[", type: OperatorType.Binary, precedence: { precedence: 19, associativity: Associativity.Left } },
    <IUnaryOperator>{ identifier: "new", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 19, associativity: Associativity.None } },
    <IUnaryOperator>{ identifier: "function", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 19, associativity: Associativity.Left } },
    // ["new", { precedence: 18, associativity: Associativity.Right, type: OperatorType.Unary, position: UnaryPosition.Prefix }],
    <IUnaryOperator>{ identifier: "++", type: OperatorType.Unary, position: UnaryPosition.Postfix, precedence: { precedence: 17, associativity: Associativity.None } },
    <IUnaryOperator>{ identifier: "--", type: OperatorType.Unary, position: UnaryPosition.Postfix, precedence: { precedence: 17, associativity: Associativity.None } },
    <IUnaryOperator>{ identifier: "!", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    <IUnaryOperator>{ identifier: "~", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    <IUnaryOperator>{ identifier: "+", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    <IUnaryOperator>{ identifier: "-", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    <IUnaryOperator>{ identifier: "++", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    <IUnaryOperator>{ identifier: "--", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    <IUnaryOperator>{ identifier: "typeof", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    <IUnaryOperator>{ identifier: "void", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    <IUnaryOperator>{ identifier: "delete", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    <IUnaryOperator>{ identifier: "await", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    { identifier: "**", type: OperatorType.Binary, precedence: { precedence: 15, associativity: Associativity.Right } },
    { identifier: "*", type: OperatorType.Binary, precedence: { precedence: 14, associativity: Associativity.Left } },
    { identifier: "/", type: OperatorType.Binary, precedence: { precedence: 14, associativity: Associativity.Left } },
    { identifier: "%", type: OperatorType.Binary, precedence: { precedence: 14, associativity: Associativity.Left } },
    { identifier: "+", type: OperatorType.Binary, precedence: { precedence: 13, associativity: Associativity.Left } },
    { identifier: "-", type: OperatorType.Binary, precedence: { precedence: 13, associativity: Associativity.Left } },
    { identifier: "<<", type: OperatorType.Binary, precedence: { precedence: 12, associativity: Associativity.Left } },
    { identifier: ">>", type: OperatorType.Binary, precedence: { precedence: 12, associativity: Associativity.Left } },
    { identifier: ">>>", type: OperatorType.Binary, precedence: { precedence: 12, associativity: Associativity.Left } },
    { identifier: "<", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left } },
    { identifier: "<=", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left } },
    { identifier: ">", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left } },
    { identifier: ">=", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left } },
    { identifier: "in", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left } },
    { identifier: "instanceof", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left } },
    { identifier: "==", type: OperatorType.Binary, precedence: { precedence: 10, associativity: Associativity.Left } },
    { identifier: "!=", type: OperatorType.Binary, precedence: { precedence: 10, associativity: Associativity.Left } },
    { identifier: "===", type: OperatorType.Binary, precedence: { precedence: 10, associativity: Associativity.Left } },
    { identifier: "!==", type: OperatorType.Binary, precedence: { precedence: 10, associativity: Associativity.Left } },
    { identifier: "&", type: OperatorType.Binary, precedence: { precedence: 9, associativity: Associativity.Left } },
    { identifier: "^", type: OperatorType.Binary, precedence: { precedence: 8, associativity: Associativity.Left } },
    { identifier: "|", type: OperatorType.Binary, precedence: { precedence: 7, associativity: Associativity.Left } },
    { identifier: "&&", type: OperatorType.Binary, precedence: { precedence: 6, associativity: Associativity.Left } },
    { identifier: "||", type: OperatorType.Binary, precedence: { precedence: 5, associativity: Associativity.Left } },
    { identifier: "?", type: OperatorType.Ternary, precedence: { precedence: 4, associativity: Associativity.Right } },
    { identifier: "=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right } },
    { identifier: "+=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right } },
    { identifier: "-=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right } },
    { identifier: "**=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right } },
    { identifier: "*=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right } },
    { identifier: "/=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right } },
    { identifier: "%=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right } },
    { identifier: "<<=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right } },
    { identifier: ">>=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right } },
    { identifier: ">>>=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right } },
    { identifier: "&=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right } },
    { identifier: "^=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right } },
    { identifier: "|=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right } },
    <IUnaryOperator>{ identifier: "yield*", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 2, associativity: Associativity.Right } },
    <IUnaryOperator>{ identifier: "yield", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 2, associativity: Associativity.Right } },
    { identifier: ",", type: OperatorType.Binary, precedence: { precedence: 1, associativity: Associativity.Left } }
];
