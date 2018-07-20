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
import { SubtractionExpression } from "./Expression/SubtractionExpression";
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
    { identifier: ".", type: OperatorType.Binary, precedence: { precedence: 19, associativity: Associativity.Left }, expressionFactory: MemberAccessExpression.create },
    { identifier: "[", type: OperatorType.Binary, precedence: { precedence: 19, associativity: Associativity.Left } },
    <IUnaryOperator>{ identifier: "new", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 19, associativity: Associativity.None } },
    { identifier: "(", type: OperatorType.Binary, precedence: { precedence: 18, associativity: Associativity.Left } },
    // <IUnaryOperator>{ identifier: "function", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 19, associativity: Associativity.Left } },
    // <IUnaryOperator>{ identifier: "new", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 18, associativity: Associativity.Right } },
    <IUnaryOperator>{ identifier: "++", type: OperatorType.Unary, position: UnaryPosition.Postfix, precedence: { precedence: 17, associativity: Associativity.None }, expressionFactory: RightIncrementExpression.create },
    <IUnaryOperator>{ identifier: "--", type: OperatorType.Unary, position: UnaryPosition.Postfix, precedence: { precedence: 17, associativity: Associativity.None }, expressionFactory: RightDecrementExpression.create },
    <IUnaryOperator>{ identifier: "!", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: NotExpression.create },
    <IUnaryOperator>{ identifier: "~", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: BitwiseNotExpression.create },
    <IUnaryOperator>{ identifier: "+", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (exp) => exp },
    <IUnaryOperator>{ identifier: "-", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: NegationExpression.create },
    <IUnaryOperator>{ identifier: "++", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: LeftIncrementExpression.create },
    <IUnaryOperator>{ identifier: "--", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: LeftDecrementExpression.create },
    <IUnaryOperator>{ identifier: "typeof", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: TypeofExpression.create },
    // <IUnaryOperator>{ identifier: "void", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    // <IUnaryOperator>{ identifier: "delete", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    // <IUnaryOperator>{ identifier: "await", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right } },
    { identifier: "**", type: OperatorType.Binary, precedence: { precedence: 15, associativity: Associativity.Right }, expressionFactory: ExponentiationExpression.create },
    { identifier: "*", type: OperatorType.Binary, precedence: { precedence: 14, associativity: Associativity.Left }, expressionFactory: MultiplicationExpression.create },
    { identifier: "/", type: OperatorType.Binary, precedence: { precedence: 14, associativity: Associativity.Left }, expressionFactory: DivisionExpression.create },
    { identifier: "%", type: OperatorType.Binary, precedence: { precedence: 14, associativity: Associativity.Left }, expressionFactory: ModulusExpression.create },
    { identifier: "+", type: OperatorType.Binary, precedence: { precedence: 13, associativity: Associativity.Left }, expressionFactory: AdditionExpression.create },
    { identifier: "-", type: OperatorType.Binary, precedence: { precedence: 13, associativity: Associativity.Left }, expressionFactory: SubtractionExpression.create },
    { identifier: "<<", type: OperatorType.Binary, precedence: { precedence: 12, associativity: Associativity.Left }, expressionFactory: BitwiseZeroLeftShiftExpression.create },
    { identifier: ">>", type: OperatorType.Binary, precedence: { precedence: 12, associativity: Associativity.Left }, expressionFactory: BitwiseZeroRightShiftExpression.create },
    { identifier: ">>>", type: OperatorType.Binary, precedence: { precedence: 12, associativity: Associativity.Left }, expressionFactory: BitwiseSignedRightShiftExpression.create },
    { identifier: "<", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left }, expressionFactory: LessThanExpression.create },
    { identifier: "<=", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left }, expressionFactory: LessEqualExpression.create },
    { identifier: ">", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left }, expressionFactory: GreaterThanExpression.create },
    { identifier: ">=", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left }, expressionFactory: GreaterEqualExpression.create },
    { identifier: "in", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left }, expressionFactory: () => { throw new Error("operator not supported"); } },
    { identifier: "instanceof", type: OperatorType.Binary, precedence: { precedence: 11, associativity: Associativity.Left }, expressionFactory: InstanceofExpression.create },
    { identifier: "==", type: OperatorType.Binary, precedence: { precedence: 10, associativity: Associativity.Left }, expressionFactory: EqualExpression.create },
    { identifier: "!=", type: OperatorType.Binary, precedence: { precedence: 10, associativity: Associativity.Left }, expressionFactory: NotEqualExpression.create },
    { identifier: "===", type: OperatorType.Binary, precedence: { precedence: 10, associativity: Associativity.Left }, expressionFactory: StrictEqualExpression.create },
    { identifier: "!==", type: OperatorType.Binary, precedence: { precedence: 10, associativity: Associativity.Left }, expressionFactory: StrictNotEqualExpression.create },
    { identifier: "&", type: OperatorType.Binary, precedence: { precedence: 9, associativity: Associativity.Left }, expressionFactory: BitwiseAndExpression.create },
    { identifier: "^", type: OperatorType.Binary, precedence: { precedence: 8, associativity: Associativity.Left }, expressionFactory: BitwiseXorExpression.create },
    { identifier: "|", type: OperatorType.Binary, precedence: { precedence: 7, associativity: Associativity.Left }, expressionFactory: BitwiseOrExpression.create },
    { identifier: "&&", type: OperatorType.Binary, precedence: { precedence: 6, associativity: Associativity.Left }, expressionFactory: AndExpression.create },
    { identifier: "||", type: OperatorType.Binary, precedence: { precedence: 5, associativity: Associativity.Left }, expressionFactory: OrExpression.create },
    { identifier: "?", type: OperatorType.Ternary, precedence: { precedence: 4, associativity: Associativity.Right }, expressionFactory: TernaryExpression.create },
    { identifier: "=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: AssignmentExpression.create },
    { identifier: "+=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: AdditionAssignmentExpression.create },
    { identifier: "-=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: SubstractionAssignmentExpression.create },
    { identifier: "**=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: ExponentiationAssignmentExpression.create },
    { identifier: "*=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: MultiplicationAssignmentExpression.create },
    { identifier: "/=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: DivisionAssignmentExpression.create },
    { identifier: "%=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: ModulusAssignmentExpression.create },
    { identifier: "<<=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: BitwiseZeroLeftShiftAssignmentExpression.create },
    { identifier: ">>=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: BitwiseZeroRightShiftAssignmentExpression.create },
    { identifier: ">>>=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: BitwiseSignedRightShiftAssignmentExpression.create },
    { identifier: "&=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: BitwiseAndAssignmentExpression.create },
    { identifier: "^=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: BitwiseXorAssignmentExpression.create },
    { identifier: "|=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: BitwiseOrAssignmentExpression.create },
    // <IUnaryOperator>{ identifier: "yield*", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 2, associativity: Associativity.Right } },
    // <IUnaryOperator>{ identifier: "yield", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 2, associativity: Associativity.Right } },
    // coma used as a breaker
    // { identifier: ",", type: OperatorType.Binary, precedence: { precedence: 1, associativity: Associativity.Left } }
];
