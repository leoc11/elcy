import { NotExpression } from "./Expression/NotExpression";
import { ExponentiationExpression } from "./Expression/ExponentiationExpression";
import { ModulusExpression } from "./Expression/ModulusExpression";
import { AssignmentExpression } from "./Expression/AssignmentExpression";
import { AdditionAssignmentExpression } from "./Expression/AdditionAssignmentExpression";
import { SubstractionAssignmentExpression } from "./Expression/SubstractionAssignmentExpression";
import { ExponentiationAssignmentExpression } from "./Expression/ExponentiationAssignmentExpression";
import { MultiplicationAssignmentExpression } from "./Expression/MultiplicationAssignmentExpression";
import { DivisionAssignmentExpression } from "./Expression/DivisionAssignmentExpression";
import { ModulusAssignmentExpression } from "./Expression/ModulusAssignmentExpression";
import { BitwiseZeroLeftShiftAssignmentExpression } from "./Expression/BitwiseZeroLeftShiftAssignmentExpression";
import { BitwiseZeroRightShiftAssignmentExpression } from "./Expression/BitwiseZeroRightShiftAssignmentExpression";
import { BitwiseSignedRightShiftAssignmentExpression } from "./Expression/BitwiseSignedRightShiftAssignmentExpression";
import { BitwiseAndAssignmentExpression } from "./Expression/BitwiseAndAssignmentExpression";
import { BitwiseXorAssignmentExpression } from "./Expression/BitwiseXorAssignmentExpression";
import { BitwiseOrAssignmentExpression } from "./Expression/BitwiseOrAssignmentExpression";
import { IExpression } from "./Expression/IExpression";
import { MemberAccessExpression } from "./Expression/MemberAccessExpression";
import { RightIncrementExpression } from "./Expression/RightIncrementExpression";
import { RightDecrementExpression } from "./Expression/RightDecrementExpression";
import { BitwiseNotExpression } from "./Expression/BitwiseNotExpression";
import { NegationExpression } from "./Expression/NegationExpression";
import { MultiplicationExpression } from "./Expression/MultiplicationExpression";
import { DivisionExpression } from "./Expression/DivisionExpression";
import { AdditionExpression } from "./Expression/AdditionExpression";
import { SubstractionExpression } from "./Expression/SubstractionExpression";
import { BitwiseZeroLeftShiftExpression } from "./Expression/BitwiseZeroLeftShiftExpression";
import { BitwiseZeroRightShiftExpression } from "./Expression/BitwiseZeroRightShiftExpression";
import { BitwiseSignedRightShiftExpression } from "./Expression/BitwiseSignedRightShiftExpression";
import { LessThanExpression } from "./Expression/LessThanExpression";
import { LessEqualExpression } from "./Expression/LessEqualExpression";
import { GreaterThanExpression } from "./Expression/GreaterThanExpression";
import { GreaterEqualExpression } from "./Expression/GreaterEqualExpression";
import { EqualExpression } from "./Expression/EqualExpression";
import { NotEqualExpression } from "./Expression/NotEqualExpression";
import { InstanceofExpression } from "./Expression/InstanceofExpression";
import { StrictEqualExpression } from "./Expression/StrictEqualExpression";
import { StrictNotEqualExpression } from "./Expression/StrictNotEqualExpression";
import { BitwiseAndExpression } from "./Expression/BitwiseAndExpression";
import { BitwiseXorExpression } from "./Expression/BitwiseXorExpression";
import { BitwiseOrExpression } from "./Expression/BitwiseOrExpression";
import { AndExpression } from "./Expression/AndExpression";
import { OrExpression } from "./Expression/OrExpression";
import { TernaryExpression } from "./Expression/TernaryExpression";
import { LeftIncrementExpression } from "./Expression/LeftIncrementExpression";
import { LeftDecrementExpression } from "./Expression/LeftDecrementExpression";
import { TypeofExpression } from "./Expression/TypeofExpression";
import { ParameterExpression } from "./Expression/ParameterExpression";
import { SpreadExpression } from "./Expression/SpreadExpression";

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
    <IUnaryOperator>{ identifier: "[", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 20, associativity: Associativity.None } },
    <IUnaryOperator>{ identifier: "(", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 20, associativity: Associativity.None } },
    <IUnaryOperator>{ identifier: "...", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 20, associativity: Associativity.None }, expressionFactory: (op) => new SpreadExpression(op) },
    { identifier: ".", type: OperatorType.Binary, precedence: { precedence: 19, associativity: Associativity.Left }, expressionFactory: (objectExp: IExpression, memberName: string) => new MemberAccessExpression(objectExp, memberName) },
    { identifier: "[", type: OperatorType.Binary, precedence: { precedence: 19, associativity: Associativity.Left } },
    <IUnaryOperator>{ identifier: "new", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 19, associativity: Associativity.None } },
    { identifier: "(", type: OperatorType.Binary, precedence: { precedence: 18, associativity: Associativity.Left } },
    // <IUnaryOperator>{ identifier: "function", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 19, associativity: Associativity.Left } },
    // <IUnaryOperator>{ identifier: "new", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 18, associativity: Associativity.Right } },
    <IUnaryOperator>{ identifier: "++", type: OperatorType.Unary, position: UnaryPosition.Postfix, precedence: { precedence: 17, associativity: Associativity.None }, expressionFactory: (op) => new RightIncrementExpression(op) },
    <IUnaryOperator>{ identifier: "--", type: OperatorType.Unary, position: UnaryPosition.Postfix, precedence: { precedence: 17, associativity: Associativity.None }, expressionFactory: (op) => new RightDecrementExpression(op) },
    <IUnaryOperator>{ identifier: "!", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (op) => new NotExpression(op) },
    <IUnaryOperator>{ identifier: "~", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (op) => new BitwiseNotExpression(op) },
    <IUnaryOperator>{ identifier: "+", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (exp) => exp },
    <IUnaryOperator>{ identifier: "-", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (op) => new NegationExpression(op) },
    <IUnaryOperator>{ identifier: "++", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (op) => new LeftIncrementExpression(op) },
    <IUnaryOperator>{ identifier: "--", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (op) => new LeftDecrementExpression(op) },
    <IUnaryOperator>{ identifier: "typeof", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (op) => new TypeofExpression(op) },
    // <IUnaryOperator>{ identifier: "void", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    // <IUnaryOperator>{ identifier: "delete", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    // <IUnaryOperator>{ identifier: "await", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    { identifier: "**", type: OperatorType.Binary, precedence: { precedence: 15, associativity: Associativity.Right }, expressionFactory: (op1: IExpression, op2: IExpression) => new ExponentiationExpression(op1, op2) },
    { identifier: "*", type: OperatorType.Binary, precedence: { precedence: 14, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new MultiplicationExpression(op1, op2) },
    { identifier: "/", type: OperatorType.Binary, precedence: { precedence: 14, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new DivisionExpression(op1, op2) },
    { identifier: "%", type: OperatorType.Binary, precedence: { precedence: 14, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new ModulusExpression(op1, op2) },
    { identifier: "+", type: OperatorType.Binary, precedence: { precedence: 13, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new AdditionExpression(op1, op2) },
    { identifier: "-", type: OperatorType.Binary, precedence: { precedence: 13, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new SubstractionExpression(op1, op2) },
    { identifier: "<<", type: OperatorType.Binary, precedence: { precedence: 12, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new BitwiseZeroLeftShiftExpression(op1, op2) },
    { identifier: ">>", type: OperatorType.Binary, precedence: { precedence: 12, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new BitwiseZeroRightShiftExpression(op1, op2) },
    { identifier: ">>>", type: OperatorType.Binary, precedence: { precedence: 12, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new BitwiseSignedRightShiftExpression(op1, op2) },
    { identifier: "<", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new LessThanExpression(op1, op2) },
    { identifier: "<=", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new LessEqualExpression(op1, op2) },
    { identifier: ">", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new GreaterThanExpression(op1, op2) },
    { identifier: ">=", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new GreaterEqualExpression(op1, op2) },
    { identifier: "in", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left }, expressionFactory: () => { throw new Error("operator not supported"); } },
    { identifier: "instanceof", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new InstanceofExpression(op1, op2) },
    { identifier: "==", type: OperatorType.Binary, precedence: { precedence: 10, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new EqualExpression(op1, op2) },
    { identifier: "!=", type: OperatorType.Binary, precedence: { precedence: 10, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new NotEqualExpression(op1, op2) },
    { identifier: "===", type: OperatorType.Binary, precedence: { precedence: 10, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new StrictEqualExpression(op1, op2) },
    { identifier: "!==", type: OperatorType.Binary, precedence: { precedence: 10, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new StrictNotEqualExpression(op1, op2) },
    { identifier: "&", type: OperatorType.Binary, precedence: { precedence: 9, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new BitwiseAndExpression(op1, op2) },
    { identifier: "^", type: OperatorType.Binary, precedence: { precedence: 8, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new BitwiseXorExpression(op1, op2) },
    { identifier: "|", type: OperatorType.Binary, precedence: { precedence: 7, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new BitwiseOrExpression(op1, op2) },
    { identifier: "&&", type: OperatorType.Binary, precedence: { precedence: 6, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new AndExpression(op1, op2) },
    { identifier: "||", type: OperatorType.Binary, precedence: { precedence: 5, associativity: Associativity.Left }, expressionFactory: (op1: IExpression, op2: IExpression) => new OrExpression(op1, op2) },
    { identifier: "?", type: OperatorType.Ternary, precedence: { precedence: 4, associativity: Associativity.Right }, expressionFactory: (op1: IExpression, op2: IExpression, op3: IExpression) => new TernaryExpression(op1, op2, op3) },
    { identifier: "=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new AssignmentExpression(op1, op2) },
    { identifier: "+=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new AdditionAssignmentExpression(op1, op2) },
    { identifier: "-=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new SubstractionAssignmentExpression(op1, op2) },
    { identifier: "**=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new ExponentiationAssignmentExpression(op1, op2) },
    { identifier: "*=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new MultiplicationAssignmentExpression(op1, op2) },
    { identifier: "/=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new DivisionAssignmentExpression(op1, op2) },
    { identifier: "%=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new ModulusAssignmentExpression(op1, op2) },
    { identifier: "<<=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new BitwiseZeroLeftShiftAssignmentExpression(op1, op2) },
    { identifier: ">>=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new BitwiseZeroRightShiftAssignmentExpression(op1, op2) },
    { identifier: ">>>=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new BitwiseSignedRightShiftAssignmentExpression(op1, op2) },
    { identifier: "&=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new BitwiseAndAssignmentExpression(op1, op2) },
    { identifier: "^=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new BitwiseXorAssignmentExpression(op1, op2) },
    { identifier: "|=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new BitwiseOrAssignmentExpression(op1, op2) },
    // <IUnaryOperator>{ identifier: "yield*", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 2, associativity: Associativity.Right } },
    // <IUnaryOperator>{ identifier: "yield", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 2, associativity: Associativity.Right } },
    // coma used as a breaker
    // { identifier: ",", type: OperatorType.Binary, precedence: { precedence: 1, associativity: Associativity.Left } }
];
