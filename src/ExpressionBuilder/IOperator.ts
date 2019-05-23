import { AdditionAssignmentExpression } from "./Expression/AdditionAssignmentExpression";
import { AdditionExpression } from "./Expression/AdditionExpression";
import { AndExpression } from "./Expression/AndExpression";
import { AssignmentExpression } from "./Expression/AssignmentExpression";
import { BitwiseAndAssignmentExpression } from "./Expression/BitwiseAndAssignmentExpression";
import { BitwiseAndExpression } from "./Expression/BitwiseAndExpression";
import { BitwiseNotExpression } from "./Expression/BitwiseNotExpression";
import { BitwiseOrAssignmentExpression } from "./Expression/BitwiseOrAssignmentExpression";
import { BitwiseOrExpression } from "./Expression/BitwiseOrExpression";
import { BitwiseSignedRightShiftAssignmentExpression } from "./Expression/BitwiseSignedRightShiftAssignmentExpression";
import { BitwiseSignedRightShiftExpression } from "./Expression/BitwiseSignedRightShiftExpression";
import { BitwiseXorAssignmentExpression } from "./Expression/BitwiseXorAssignmentExpression";
import { BitwiseXorExpression } from "./Expression/BitwiseXorExpression";
import { BitwiseZeroLeftShiftAssignmentExpression } from "./Expression/BitwiseZeroLeftShiftAssignmentExpression";
import { BitwiseZeroLeftShiftExpression } from "./Expression/BitwiseZeroLeftShiftExpression";
import { BitwiseZeroRightShiftAssignmentExpression } from "./Expression/BitwiseZeroRightShiftAssignmentExpression";
import { BitwiseZeroRightShiftExpression } from "./Expression/BitwiseZeroRightShiftExpression";
import { DivisionAssignmentExpression } from "./Expression/DivisionAssignmentExpression";
import { DivisionExpression } from "./Expression/DivisionExpression";
import { EqualExpression } from "./Expression/EqualExpression";
import { ExponentiationAssignmentExpression } from "./Expression/ExponentiationAssignmentExpression";
import { ExponentiationExpression } from "./Expression/ExponentiationExpression";
import { GreaterEqualExpression } from "./Expression/GreaterEqualExpression";
import { GreaterThanExpression } from "./Expression/GreaterThanExpression";
import { IExpression } from "./Expression/IExpression";
import { InstanceofExpression } from "./Expression/InstanceofExpression";
import { LeftDecrementExpression } from "./Expression/LeftDecrementExpression";
import { LeftIncrementExpression } from "./Expression/LeftIncrementExpression";
import { LessEqualExpression } from "./Expression/LessEqualExpression";
import { LessThanExpression } from "./Expression/LessThanExpression";
import { MemberAccessExpression } from "./Expression/MemberAccessExpression";
import { ModulusAssignmentExpression } from "./Expression/ModulusAssignmentExpression";
import { ModulusExpression } from "./Expression/ModulusExpression";
import { MultiplicationAssignmentExpression } from "./Expression/MultiplicationAssignmentExpression";
import { MultiplicationExpression } from "./Expression/MultiplicationExpression";
import { NegationExpression } from "./Expression/NegationExpression";
import { NotEqualExpression } from "./Expression/NotEqualExpression";
import { NotExpression } from "./Expression/NotExpression";
import { OrExpression } from "./Expression/OrExpression";
import { ParameterExpression } from "./Expression/ParameterExpression";
import { RightDecrementExpression } from "./Expression/RightDecrementExpression";
import { RightIncrementExpression } from "./Expression/RightIncrementExpression";
import { SpreadExpression } from "./Expression/SpreadExpression";
import { StrictEqualExpression } from "./Expression/StrictEqualExpression";
import { StrictNotEqualExpression } from "./Expression/StrictNotEqualExpression";
import { SubstractionAssignmentExpression } from "./Expression/SubstractionAssignmentExpression";
import { SubstractionExpression } from "./Expression/SubstractionExpression";
import { TernaryExpression } from "./Expression/TernaryExpression";
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
    { identifier: "[", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 20, associativity: Associativity.None } } as IUnaryOperator,
    { identifier: "(", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 20, associativity: Associativity.None } } as IUnaryOperator,
    { identifier: "...", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 20, associativity: Associativity.None }, expressionFactory: (op) => new SpreadExpression(op) } as IUnaryOperator,
    { identifier: ".", type: OperatorType.Binary, precedence: { precedence: 19, associativity: Associativity.Left }, expressionFactory: (objectExp: IExpression, memberName: string) => new MemberAccessExpression(objectExp, memberName) },
    { identifier: "[", type: OperatorType.Binary, precedence: { precedence: 19, associativity: Associativity.Left } },
    { identifier: "new", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 19, associativity: Associativity.None } } as IUnaryOperator,
    { identifier: "(", type: OperatorType.Binary, precedence: { precedence: 18, associativity: Associativity.Left } },
    // <IUnaryOperator>{ identifier: "function", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 19, associativity: Associativity.Left } },
    // <IUnaryOperator>{ identifier: "new", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 18, associativity: Associativity.Right } },
    { identifier: "++", type: OperatorType.Unary, position: UnaryPosition.Postfix, precedence: { precedence: 17, associativity: Associativity.None }, expressionFactory: (op) => new RightIncrementExpression(op) } as IUnaryOperator,
    { identifier: "--", type: OperatorType.Unary, position: UnaryPosition.Postfix, precedence: { precedence: 17, associativity: Associativity.None }, expressionFactory: (op) => new RightDecrementExpression(op) } as IUnaryOperator,
    { identifier: "!", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (op) => new NotExpression(op) } as IUnaryOperator,
    { identifier: "~", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (op) => new BitwiseNotExpression(op) } as IUnaryOperator,
    { identifier: "+", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (exp) => exp } as IUnaryOperator,
    { identifier: "-", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (op) => new NegationExpression(op) } as IUnaryOperator,
    { identifier: "++", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (op) => new LeftIncrementExpression(op) } as IUnaryOperator,
    { identifier: "--", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (op) => new LeftDecrementExpression(op) } as IUnaryOperator,
    { identifier: "typeof", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 16, associativity: Associativity.Right }, expressionFactory: (op) => new TypeofExpression(op) } as IUnaryOperator,
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
    { identifier: "|=", type: OperatorType.Binary, precedence: { precedence: 3, associativity: Associativity.Right }, expressionFactory: (op1: ParameterExpression, op2: IExpression) => new BitwiseOrAssignmentExpression(op1, op2) }
    // <IUnaryOperator>{ identifier: "yield*", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 2, associativity: Associativity.Right } },
    // <IUnaryOperator>{ identifier: "yield", type: OperatorType.Unary, position: UnaryPosition.Prefix, precedence: { precedence: 2, associativity: Associativity.Right } },
    // coma used as a breaker
    // { identifier: ",", type: OperatorType.Binary, precedence: { precedence: 1, associativity: Associativity.Left } }
];
