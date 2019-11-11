import { ParameterStack } from "../Common/ParameterStack";
import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";
import { SqlTableValueParameterExpression } from "../Queryable/QueryExpression/SqlTableValueParameterExpression";
import { AdditionAssignmentExpression } from "./Expression/AdditionAssignmentExpression";
import { AdditionExpression } from "./Expression/AdditionExpression";
import { AndExpression } from "./Expression/AndExpression";
import { ArrayValueExpression } from "./Expression/ArrayValueExpression";
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
import { FunctionCallExpression } from "./Expression/FunctionCallExpression";
import { FunctionExpression } from "./Expression/FunctionExpression";
import { GreaterEqualExpression } from "./Expression/GreaterEqualExpression";
import { GreaterThanExpression } from "./Expression/GreaterThanExpression";
import { IExpression } from "./Expression/IExpression";
import { InstanceofExpression } from "./Expression/InstanceofExpression";
import { InstantiationExpression } from "./Expression/InstantiationExpression";
import { LeftDecrementExpression } from "./Expression/LeftDecrementExpression";
import { LeftIncrementExpression } from "./Expression/LeftIncrementExpression";
import { LessEqualExpression } from "./Expression/LessEqualExpression";
import { LessThanExpression } from "./Expression/LessThanExpression";
import { MemberAccessExpression } from "./Expression/MemberAccessExpression";
import { MethodCallExpression } from "./Expression/MethodCallExpression";
import { ModulusAssignmentExpression } from "./Expression/ModulusAssignmentExpression";
import { ModulusExpression } from "./Expression/ModulusExpression";
import { MultiplicationAssignmentExpression } from "./Expression/MultiplicationAssignmentExpression";
import { MultiplicationExpression } from "./Expression/MultiplicationExpression";
import { NegationExpression } from "./Expression/NegationExpression";
import { NotEqualExpression } from "./Expression/NotEqualExpression";
import { NotExpression } from "./Expression/NotExpression";
import { ObjectValueExpression } from "./Expression/ObjectValueExpression";
import { OrExpression } from "./Expression/OrExpression";
import { ParameterExpression } from "./Expression/ParameterExpression";
import { RightDecrementExpression } from "./Expression/RightDecrementExpression";
import { RightIncrementExpression } from "./Expression/RightIncrementExpression";
import { StrictEqualExpression } from "./Expression/StrictEqualExpression";
import { StrictNotEqualExpression } from "./Expression/StrictNotEqualExpression";
import { StringTemplateExpression } from "./Expression/StringTemplateExpression";
import { SubstractionAssignmentExpression } from "./Expression/SubstractionAssignmentExpression";
import { SubstractionExpression } from "./Expression/SubstractionExpression";
import { TernaryExpression } from "./Expression/TernaryExpression";
import { TypeofExpression } from "./Expression/TypeofExpression";
import { ValueExpression } from "./Expression/ValueExpression";
import { ExpressionBuilder } from "./ExpressionBuilder";

export class ExpressionExecutor {
    constructor()
    constructor(stack: ParameterStack)
    constructor(params: { [key: string]: any })
    constructor(params?: ParameterStack | { [key: string]: any }) {
        if (params instanceof ParameterStack) {
            this.stack = params;
        }
        else {
            this.stack = new ParameterStack();
            if (params) {
                this.setParameters(params);
            }
        }
    }
    public static execute<T = unknown>(expression: IExpression<T>): T {
        return new ExpressionExecutor().execute(expression);
    }
    public stack: ParameterStack;
    // TODO: SQLParameterExpression
    public execute<T = unknown>(expression: IExpression<T>): T {
        switch (expression.constructor) {
            case AdditionAssignmentExpression:
                return this.executeAdditionAssignment(expression as any) as any;
            case AdditionExpression:
                return this.executeAddition(expression as AdditionExpression);
            case AndExpression:
                return this.executeAnd(expression as any) as any;
            case ArrayValueExpression:
                return this.executeArrayValue(expression as any) as any;
            case AssignmentExpression:
                return this.executeAssignment(expression as AssignmentExpression<T>);
            case BitwiseAndAssignmentExpression:
                return this.executeBitwiseAndAssignment(expression as any) as any;
            case BitwiseAndExpression:
                return this.executeBitwiseAnd(expression as any) as any;
            case BitwiseNotExpression:
                return this.executeBitwiseNot(expression as any) as any;
            case BitwiseOrAssignmentExpression:
                return this.executeBitwiseOrAssignment(expression as any) as any;
            case BitwiseOrExpression:
                return this.executeBitwiseOr(expression as any) as any;
            case BitwiseSignedRightShiftAssignmentExpression:
                return this.executeBitwiseSignedRightShiftAssignment(expression as any) as any;
            case BitwiseSignedRightShiftExpression:
                return this.executeBitwiseSignedRightShift(expression as any) as any;
            case BitwiseXorAssignmentExpression:
                return this.executeBitwiseXorAssignment(expression as any) as any;
            case BitwiseXorExpression:
                return this.executeBitwiseXor(expression as any) as any;
            case BitwiseZeroLeftShiftAssignmentExpression:
                return this.executeBitwiseZeroLeftShiftAssignment(expression as any) as any;
            case BitwiseZeroLeftShiftExpression:
                return this.executeBitwiseZeroLeftShift(expression as any) as any;
            case BitwiseZeroRightShiftAssignmentExpression:
                return this.executeBitwiseZeroRightShiftAssignment(expression as any) as any;
            case BitwiseZeroRightShiftExpression:
                return this.executeBitwiseZeroRightShift(expression as any) as any;
            case DivisionAssignmentExpression:
                return this.executeDivisionAssignment(expression as any) as any;
            case DivisionExpression:
                return this.executeDivision(expression as any) as any;
            case EqualExpression:
                return this.executeEqual(expression as any) as any;
            case ExponentiationAssignmentExpression:
                return this.executeExponentialAssignment(expression as any) as any;
            case ExponentiationExpression:
                return this.executeExponential(expression as any) as any;
            case FunctionCallExpression:
                return this.executeFunctionCall(expression as FunctionCallExpression<T>);
            case FunctionExpression:
                return this.executeFunction(expression as FunctionExpression<T>, []);
            case GreaterEqualExpression:
                return this.executeGreaterEqual(expression as any) as any;
            case GreaterThanExpression:
                return this.executeGreaterThan(expression as any) as any;
            case InstanceofExpression:
                return this.executeInstanceof(expression as any) as any;
            case InstantiationExpression:
                return this.executeInstantiation(expression as any);
            case LeftDecrementExpression:
                return this.executeLeftDecrement(expression as any) as any;
            case LeftIncrementExpression:
                return this.executeLeftIncrement(expression as any) as any;
            case LessEqualExpression:
                return this.executeLessEqual(expression as any) as any;
            case LessThanExpression:
                return this.executeLessThan(expression as any) as any;
            case MemberAccessExpression:
                return this.executeMemberAccess(expression as MemberAccessExpression<any, any, T>);
            case MethodCallExpression:
                return this.executeMethodCall(expression as MethodCallExpression<any, any, T>);
            case ModulusAssignmentExpression:
                return this.executeModulusAssignment(expression as any) as any;
            case ModulusExpression:
                return this.executeModulus(expression as any) as any;
            case MultiplicationAssignmentExpression:
                return this.executeMultiplicationAssignment(expression as any) as any;
            case MultiplicationExpression:
                return this.executeMultiplication(expression as any) as any;
            case NegationExpression:
                return this.executeNegation(expression as any) as any;
            case NotEqualExpression:
                return this.executeNotEqual(expression as any) as any;
            case NotExpression:
                return this.executeNot(expression as any) as any;
            case ObjectValueExpression:
                return this.executeObjectValue(expression as ObjectValueExpression);
            case OrExpression:
                return this.executeOr(expression as any) as any;
            case ParameterExpression:
                return this.executeParameter(expression as ParameterExpression);
            case SqlTableValueParameterExpression:
            case SqlParameterExpression:
                return this.executeSqlParameter(expression as SqlParameterExpression);
            case RightDecrementExpression:
                return this.executeRightDecrement(expression as any) as any;
            case RightIncrementExpression:
                return this.executeRightIncrement(expression as any) as any;
            case StrictEqualExpression:
                return this.executeStrictEqual(expression as any) as any;
            case StrictNotEqualExpression:
                return this.executeStrictNotEqual(expression as any) as any;
            case SubstractionAssignmentExpression:
                return this.executeSubstractionAssignment(expression as any) as any;
            case SubstractionExpression:
                return this.executeSubstraction(expression as any) as any;
            case TernaryExpression:
                return this.executeTernary(expression as TernaryExpression);
            case TypeofExpression:
                return this.executeTypeof(expression as any) as any;
            case ValueExpression:
                return this.executeValue(expression as ValueExpression<T>);
            case StringTemplateExpression:
                return this.executeStringTemplate(expression as any) as any;
            default:
                throw new Error(`expression "${expression.toString()}" not supported`);
        }
    }
    public executeFunction<T>(expression: FunctionExpression<T>, parameters: any[]) {
        let i = 0;
        for (const param of expression.params) {
            if (parameters.length > i) {
                this.stack.push(param.name, parameters[i++]);
            }
        }
        const result = this.execute(expression.body);
        i = 0;
        for (const param of expression.params) {
            if (parameters.length > i++) {
                this.stack.pop(param.name);
            }
        }
        return result;
    }
    public setParameters(params: { [key: string]: any }) {
        this.stack.set(params);
    }
    public toString(expression: IExpression) {
        return expression.toString();
    }
    protected executeAddition<T extends string | number>(expression: AdditionExpression<T>): T {
        return this.execute(expression.leftOperand) as any + this.execute(expression.rightOperand);
    }

    protected executeAdditionAssignment<T extends string | number>(expression: AdditionAssignmentExpression<T>): T {
        const value = this.stack.get(expression.leftOperand.name) + this.execute(expression.rightOperand);
        this.stack.pop(expression.leftOperand.name);
        this.stack.push(expression.leftOperand.name, value);
        return value;
    }
    protected executeAnd(expression: AndExpression) {
        return this.execute(expression.leftOperand) && this.execute(expression.rightOperand);
    }
    protected executeArrayValue<T>(expression: ArrayValueExpression<T>): T[] {
        const result = [];
        for (const item of expression.items) {
            result.push(this.execute(item));
        }
        return result;
    }
    protected executeAssignment<T>(expression: AssignmentExpression<T>): T {
        const value = this.execute(expression.rightOperand);
        this.stack.pop(expression.leftOperand.name);
        this.stack.push(expression.leftOperand.name, value);
        return value;
    }
    protected executeBitwiseAnd(expression: BitwiseAndExpression) {
        return this.execute(expression.leftOperand) & this.execute(expression.rightOperand);
    }
    protected executeBitwiseAndAssignment(expression: BitwiseAndAssignmentExpression) {
        const value = this.stack.get(expression.leftOperand.name) & this.execute(expression.rightOperand);
        this.stack.pop(expression.leftOperand.name);
        this.stack.push(expression.leftOperand.name, value);
        return value;
    }
    protected executeBitwiseNot(expression: BitwiseNotExpression) {
        return ~this.execute(expression.operand);
    }
    protected executeBitwiseOr(expression: BitwiseAndExpression) {
        return this.execute(expression.leftOperand) | this.execute(expression.rightOperand);
    }
    protected executeBitwiseOrAssignment(expression: BitwiseOrAssignmentExpression) {
        const value = this.stack.get(expression.leftOperand.name) | this.execute(expression.rightOperand);
        this.stack.pop(expression.leftOperand.name);
        this.stack.push(expression.leftOperand.name, value);
        return value;
    }
    protected executeBitwiseSignedRightShift(expression: BitwiseSignedRightShiftExpression) {
        return this.execute(expression.leftOperand) >>> this.execute(expression.rightOperand);
    }
    protected executeBitwiseSignedRightShiftAssignment(expression: BitwiseSignedRightShiftAssignmentExpression) {
        const value = this.stack.get(expression.leftOperand.name) >>> this.execute(expression.rightOperand);
        this.stack.pop(expression.leftOperand.name);
        this.stack.push(expression.leftOperand.name, value);
        return value;
    }
    protected executeBitwiseXor(expression: BitwiseXorExpression) {
        return this.execute(expression.leftOperand) ^ this.execute(expression.rightOperand);
    }
    protected executeBitwiseXorAssignment(expression: BitwiseXorAssignmentExpression) {
        const value = this.stack.get(expression.leftOperand.name) ^ this.execute(expression.rightOperand);
        this.stack.pop(expression.leftOperand.name);
        this.stack.push(expression.leftOperand.name, value);
        return value;
    }
    protected executeBitwiseZeroLeftShift(expression: BitwiseZeroLeftShiftExpression) {
        return this.execute(expression.leftOperand) << this.execute(expression.rightOperand);
    }
    protected executeBitwiseZeroLeftShiftAssignment(expression: BitwiseZeroLeftShiftAssignmentExpression) {
        const value = this.stack.get(expression.leftOperand.name) << this.execute(expression.rightOperand);
        this.stack.pop(expression.leftOperand.name);
        this.stack.push(expression.leftOperand.name, value);
        return value;
    }
    protected executeBitwiseZeroRightShift(expression: BitwiseZeroRightShiftExpression) {
        return this.execute(expression.leftOperand) >> this.execute(expression.rightOperand);
    }
    protected executeBitwiseZeroRightShiftAssignment(expression: BitwiseZeroRightShiftAssignmentExpression) {
        const value = this.stack.get(expression.leftOperand.name) >> this.execute(expression.rightOperand);
        this.stack.pop(expression.leftOperand.name);
        this.stack.push(expression.leftOperand.name, value);
        return value;
    }
    protected executeDivision(expression: DivisionExpression) {
        return this.execute(expression.leftOperand) / this.execute(expression.rightOperand);
    }
    protected executeDivisionAssignment(expression: DivisionAssignmentExpression) {
        const value = this.stack.get(expression.leftOperand.name) / this.execute(expression.rightOperand);
        this.stack.pop(expression.leftOperand.name);
        this.stack.push(expression.leftOperand.name, value);
        return value;
    }
    protected executeEqual(expression: EqualExpression) {
        // tslint:disable-next-line:triple-equals
        return this.execute(expression.leftOperand) == this.execute(expression.rightOperand);
    }
    protected executeExponential(expression: ExponentiationExpression) {
        return this.execute(expression.leftOperand) ** this.execute(expression.rightOperand);
    }
    protected executeExponentialAssignment(expression: ExponentiationAssignmentExpression) {
        const value = this.stack.get(expression.leftOperand.name) ** this.execute(expression.rightOperand);
        this.stack.pop(expression.leftOperand.name);
        this.stack.push(expression.leftOperand.name, value);
        return value;
    }
    protected executeFunctionCall<T>(expression: FunctionCallExpression<T>): T {
        const params = [];
        for (const param of expression.params) {
            params.push(this.execute(param));
        }
        const fn = this.execute(expression.fnExpression);
        return fn.apply(null, params);
    }
    protected executeGreaterEqual(expression: GreaterEqualExpression) {
        return this.execute(expression.leftOperand) >= this.execute(expression.rightOperand);
    }
    protected executeGreaterThan(expression: GreaterThanExpression) {
        return this.execute(expression.leftOperand) > this.execute(expression.rightOperand);
    }
    protected executeInstanceof(expression: InstanceofExpression) {
        return this.execute(expression.leftOperand) instanceof this.execute(expression.rightOperand);
    }
    protected executeInstantiation<T>(expression: InstantiationExpression<T>): T {
        const params = [];
        for (const param of expression.params) {
            params.push(this.execute(param));
        }
        const type = this.execute(expression.typeOperand);
        return new type(...params);
    }
    protected executeLeftDecrement(expression: LeftDecrementExpression) {
        const value = this.executeParameter(expression.operand) - 1;
        this.stack.pop(expression.operand.name);
        this.stack.push(expression.operand.name, value);
        return value;
    }
    protected executeLeftIncrement(expression: LeftIncrementExpression) {
        const value = this.executeParameter(expression.operand) + 1;
        this.stack.pop(expression.operand.name);
        this.stack.push(expression.operand.name, value);
        return value;
    }
    protected executeLessEqual(expression: LessEqualExpression) {
        return this.execute(expression.leftOperand) <= this.execute(expression.rightOperand);
    }
    protected executeLessThan(expression: LessThanExpression) {
        return this.execute(expression.leftOperand) < this.execute(expression.rightOperand);
    }
    protected executeMemberAccess<TE, K extends keyof TE>(expression: MemberAccessExpression<TE, K>) {
        return this.execute(expression.objectOperand)[expression.memberName];
    }
    protected executeMethodCall<TE, K extends keyof TE, T>(expression: MethodCallExpression<TE, K, T>): T {
        const params = [];
        for (const param of expression.params) {
            params.push(this.execute(param));
        }

        const obj = this.execute(expression.objectOperand);
        const method = obj[expression.methodName] as TE[K] & ((...params: any) => T);
        return method.apply(obj, params);
    }
    protected executeModulus(expression: ModulusExpression) {
        return this.execute(expression.leftOperand) % this.execute(expression.rightOperand);
    }
    protected executeModulusAssignment(expression: ModulusAssignmentExpression) {
        const value = this.stack.get(expression.leftOperand.name) % this.execute(expression.rightOperand);
        this.stack.pop(expression.leftOperand.name);
        this.stack.push(expression.leftOperand.name, value);
        return value;
    }
    protected executeMultiplication(expression: MultiplicationExpression) {
        return this.execute(expression.leftOperand) * this.execute(expression.rightOperand);
    }
    protected executeMultiplicationAssignment(expression: MultiplicationAssignmentExpression) {
        const value = this.stack.get(expression.leftOperand.name) * this.execute(expression.rightOperand);
        this.stack.pop(expression.leftOperand.name);
        this.stack.push(expression.leftOperand.name, value);
        return value;
    }
    protected executeNegation(expression: NegationExpression) {
        return -this.execute(expression.operand);
    }
    protected executeNot(expression: NotExpression) {
        return !this.execute(expression.operand);
    }
    protected executeNotEqual(expression: NotEqualExpression) {
        // tslint:disable-next-line:triple-equals
        return this.execute(expression.leftOperand) != this.execute(expression.rightOperand);
    }
    protected executeObjectValue<T>(expression: ObjectValueExpression<T>) {
        const result = new expression.type();
        for (const key in expression.object) {
            result[key] = this.execute(expression.object[key]);
        }
        return result;
    }
    protected executeOr(expression: OrExpression) {
        return this.execute(expression.leftOperand) || this.execute(expression.rightOperand);
    }
    protected executeParameter<T>(expression: ParameterExpression<T>): T {
        return this.stack.get(expression.name, expression.index || 0);
    }
    protected executeRightDecrement(expression: RightDecrementExpression) {
        const value = this.executeParameter(expression.operand);
        this.stack.pop(expression.operand.name);
        this.stack.push(expression.operand.name, value - 1);
        return value;
    }
    protected executeRightIncrement(expression: RightIncrementExpression) {
        const value = this.executeParameter(expression.operand);
        this.stack.pop(expression.operand.name);
        this.stack.push(expression.operand.name, value + 1);
        return value;
    }
    protected executeSqlParameter<T>(expression: SqlParameterExpression<T>): T {
        return this.execute(expression.valueExp);
    }
    protected executeStrictEqual(expression: StrictEqualExpression) {
        return this.execute(expression.leftOperand) === this.execute(expression.rightOperand);
    }
    protected executeStrictNotEqual(expression: StrictNotEqualExpression) {
        return this.execute(expression.leftOperand) !== this.execute(expression.rightOperand);
    }
    protected executeStringTemplate(expression: StringTemplateExpression): string {
        let result = "";
        let isPolymorph = false;
        let polymorphString = "";
        for (let i = 0, len = expression.template.length; i < len; i++) {
            const char = expression.template[i];
            if (isPolymorph) {
                if (char === "}") {
                    const exp = ExpressionBuilder.parse(polymorphString);
                    result += this.execute(exp);
                    isPolymorph = false;
                }
                polymorphString += char;
            }
            else if (char === "$" && expression.template[i + 1] === "{") {
                isPolymorph = true;
                i++;
                polymorphString = "";
            }
            else {
                result += char;
            }
        }
        return result;
    }
    protected executeSubstraction(expression: SubstractionExpression) {
        return this.execute(expression.leftOperand) - this.execute(expression.rightOperand);
    }
    protected executeSubstractionAssignment(expression: SubstractionAssignmentExpression) {
        const value = this.stack.get(expression.leftOperand.name) - this.execute(expression.rightOperand);
        this.stack.pop(expression.leftOperand.name);
        this.stack.push(expression.leftOperand.name, value);
        return value;
    }
    protected executeTernary(expression: TernaryExpression) {
        return this.execute(expression.logicalOperand) ? this.execute(expression.trueOperand) : this.execute(expression.falseOperand);
    }
    protected executeTypeof(expression: TypeofExpression) {
        return typeof this.execute(expression.operand);
    }
    protected executeValue<T>(expression: ValueExpression<T>): T {
        return expression.value;
    }
}
