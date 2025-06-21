import { MethodKey, MethodReturnType, StringKeyOf } from "../Common/Type";
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
import { TransformerParameter } from "./TransformerParameter";

export class ExpressionExecutor {
    constructor(params?: { [key: string | number]: unknown }) {
        if (params) {
            this.setParameters(params);
        }
    }
    public static execute<T = unknown>(expression: IExpression<T>): T {
        return new ExpressionExecutor().execute(expression);
    }
    public scopeParameters = new TransformerParameter();
    // TODO: SQLParameterExpression
    public execute<T = unknown>(expression: IExpression<T>): T {
        switch (true) {
            case expression instanceof AdditionAssignmentExpression:
                return this.executeAdditionAssignment(expression as AdditionAssignmentExpression<T & (string | number)>);
            case expression instanceof AdditionExpression:
                return this.executeAddition(expression as AdditionExpression<T & (string | number)>) as T;
            case expression instanceof AndExpression:
                return this.executeAnd(expression) as T;
            case expression instanceof ArrayValueExpression:
                return this.executeArrayValue(expression) as T;
            case expression instanceof AssignmentExpression:
                return this.executeAssignment(expression as AssignmentExpression<T>);
            case expression instanceof BitwiseAndAssignmentExpression:
                return this.executeBitwiseAndAssignment(expression) as T;
            case expression instanceof BitwiseAndExpression:
                return this.executeBitwiseAnd(expression) as T;
            case expression instanceof BitwiseNotExpression:
                return this.executeBitwiseNot(expression) as T;
            case expression instanceof BitwiseOrAssignmentExpression:
                return this.executeBitwiseOrAssignment(expression) as T;
            case expression instanceof BitwiseOrExpression:
                return this.executeBitwiseOr(expression) as T;
            case expression instanceof BitwiseSignedRightShiftAssignmentExpression:
                return this.executeBitwiseSignedRightShiftAssignment(expression) as T;
            case expression instanceof BitwiseSignedRightShiftExpression:
                return this.executeBitwiseSignedRightShift(expression) as T;
            case expression instanceof BitwiseXorAssignmentExpression:
                return this.executeBitwiseXorAssignment(expression) as T;
            case expression instanceof BitwiseXorExpression:
                return this.executeBitwiseXor(expression) as T;
            case expression instanceof BitwiseZeroLeftShiftAssignmentExpression:
                return this.executeBitwiseZeroLeftShiftAssignment(expression) as T;
            case expression instanceof BitwiseZeroLeftShiftExpression:
                return this.executeBitwiseZeroLeftShift(expression) as T;
            case expression instanceof BitwiseZeroRightShiftAssignmentExpression:
                return this.executeBitwiseZeroRightShiftAssignment(expression) as T;
            case expression instanceof BitwiseZeroRightShiftExpression:
                return this.executeBitwiseZeroRightShift(expression) as T;
            case expression instanceof DivisionAssignmentExpression:
                return this.executeDivisionAssignment(expression) as T;
            case expression instanceof DivisionExpression:
                return this.executeDivision(expression) as T;
            case expression instanceof EqualExpression:
                return this.executeEqual(expression) as T;
            case expression instanceof ExponentiationAssignmentExpression:
                return this.executeExponentialAssignment(expression) as T;
            case expression instanceof ExponentiationExpression:
                return this.executeExponential(expression) as T;
            case expression instanceof FunctionCallExpression:
                return this.executeFunctionCall(expression as FunctionCallExpression<T>);
            case expression instanceof FunctionExpression:
                return this.executeFunction(expression as FunctionExpression<T>, []);
            case expression instanceof GreaterEqualExpression:
                return this.executeGreaterEqual(expression) as T;
            case expression instanceof GreaterThanExpression:
                return this.executeGreaterThan(expression) as T;
            case expression instanceof InstanceofExpression:
                return this.executeInstanceof(expression) as T;
            case expression instanceof InstantiationExpression:
                return this.executeInstantiation(expression as InstantiationExpression<T>);
            case expression instanceof LeftDecrementExpression:
                return this.executeLeftDecrement(expression) as T;
            case expression instanceof LeftIncrementExpression:
                return this.executeLeftIncrement(expression) as T;
            case expression instanceof LessEqualExpression:
                return this.executeLessEqual(expression) as T;
            case expression instanceof LessThanExpression:
                return this.executeLessThan(expression) as T;
            case expression instanceof MemberAccessExpression:
                return this.executeMemberAccess(expression as MemberAccessExpression<unknown, StringKeyOf<unknown>, T & never>);
            case expression instanceof MethodCallExpression:
                return this.executeMethodCall(expression as MethodCallExpression<unknown, MethodKey<unknown>, T & never>);
            case expression instanceof ModulusAssignmentExpression:
                return this.executeModulusAssignment(expression) as T;
            case expression instanceof ModulusExpression:
                return this.executeModulus(expression) as T;
            case expression instanceof MultiplicationAssignmentExpression:
                return this.executeMultiplicationAssignment(expression) as T;
            case expression instanceof MultiplicationExpression:
                return this.executeMultiplication(expression) as T;
            case expression instanceof NegationExpression:
                return this.executeNegation(expression) as T;
            case expression instanceof NotEqualExpression:
                return this.executeNotEqual(expression) as T;
            case expression instanceof NotExpression:
                return this.executeNot(expression) as T;
            case expression instanceof ObjectValueExpression:
                return this.executeObjectValue(expression as ObjectValueExpression<T>);
            case expression instanceof OrExpression:
                return this.executeOr(expression) as T;
            case expression instanceof ParameterExpression:
                return this.executeParameter(expression as ParameterExpression<T>);
            case expression instanceof SqlTableValueParameterExpression:
            case expression instanceof SqlParameterExpression:
                return this.executeSqlParameter(expression as SqlParameterExpression<T>);
            case expression instanceof RightDecrementExpression:
                return this.executeRightDecrement(expression) as T;
            case expression instanceof RightIncrementExpression:
                return this.executeRightIncrement(expression) as T;
            case expression instanceof StrictEqualExpression:
                return this.executeStrictEqual(expression) as T;
            case expression instanceof StrictNotEqualExpression:
                return this.executeStrictNotEqual(expression) as T;
            case expression instanceof SubstractionAssignmentExpression:
                return this.executeSubstractionAssignment(expression) as T;
            case expression instanceof SubstractionExpression:
                return this.executeSubstraction(expression) as T;
            case expression instanceof TernaryExpression:
                return this.executeTernary(expression) as T;
            case expression instanceof TypeofExpression:
                return this.executeTypeof(expression) as T;
            case expression instanceof ValueExpression:
                return this.executeValue(expression as ValueExpression<T>);
            case expression instanceof StringTemplateExpression:
                return this.executeStringTemplate(expression) as T;
            default:
                throw new Error(`expression "${expression.toString()}" not supported`);
        }
    }
    public executeFunction<T>(expression: FunctionExpression<T>, parameters: unknown[]) {
        let i = 0;
        for (const param of expression.params) {
            if (parameters.length > i) {
                this.scopeParameters.add(param.name, parameters[i++]);
            }
        }
        const result = this.execute(expression.body);
        i = 0;
        for (const param of expression.params) {
            if (parameters.length > i++) {
                this.scopeParameters.remove(param.name);
            }
        }
        return result;
    }
    public setParameters(params: { [key: string]: unknown }) {
        for (const key in params) {
            this.scopeParameters.add(key.toString(), params[key]);
        }
    }
    public toString(expression: IExpression) {
        return expression.toString();
    }
    protected executeAddition<T extends string | number = string | number>(expression: AdditionExpression<T>): T {
        return ((this.execute(expression.leftOperand) as string) + this.execute(expression.rightOperand)) as T;
    }

    protected executeAdditionAssignment<T extends string | number>(expression: AdditionAssignmentExpression<T>): T {
        const value = (this.scopeParameters.get<string>(expression.leftOperand.name) + this.execute(expression.rightOperand)) as T;
        this.scopeParameters.remove(expression.leftOperand.name);
        this.scopeParameters.add(expression.leftOperand.name, value);
        return value;
    }
    protected executeAnd(expression: AndExpression) {
        return this.execute(expression.leftOperand) && this.execute(expression.rightOperand);
    }
    protected executeArrayValue<T>(expression: ArrayValueExpression<T>): T[] {
        const result: T[] = [];
        for (const item of expression.items) {
            result.push(this.execute(item));
        }
        return result;
    }
    protected executeAssignment<T>(expression: AssignmentExpression<T>): T {
        const value = this.execute(expression.rightOperand);
        this.scopeParameters.remove(expression.leftOperand.name);
        this.scopeParameters.add(expression.leftOperand.name, value);
        return value;
    }
    protected executeBitwiseAnd(expression: BitwiseAndExpression) {
        return this.execute(expression.leftOperand) & this.execute(expression.rightOperand);
    }
    protected executeBitwiseAndAssignment(expression: BitwiseAndAssignmentExpression) {
        const value = this.scopeParameters.get<number>(expression.leftOperand.name) & this.execute(expression.rightOperand);
        this.scopeParameters.remove(expression.leftOperand.name);
        this.scopeParameters.add(expression.leftOperand.name, value);
        return value;
    }
    protected executeBitwiseNot(expression: BitwiseNotExpression) {
        return ~this.execute(expression.operand);
    }
    protected executeBitwiseOr(expression: BitwiseAndExpression) {
        return this.execute(expression.leftOperand) | this.execute(expression.rightOperand);
    }
    protected executeBitwiseOrAssignment(expression: BitwiseOrAssignmentExpression) {
        const value = this.scopeParameters.get<number>(expression.leftOperand.name) | this.execute(expression.rightOperand);
        this.scopeParameters.remove(expression.leftOperand.name);
        this.scopeParameters.add(expression.leftOperand.name, value);
        return value;
    }
    protected executeBitwiseSignedRightShift(expression: BitwiseSignedRightShiftExpression) {
        return this.execute(expression.leftOperand) >>> this.execute(expression.rightOperand);
    }
    protected executeBitwiseSignedRightShiftAssignment(expression: BitwiseSignedRightShiftAssignmentExpression) {
        const value = this.scopeParameters.get<number>(expression.leftOperand.name) >>> this.execute(expression.rightOperand);
        this.scopeParameters.remove(expression.leftOperand.name);
        this.scopeParameters.add(expression.leftOperand.name, value);
        return value;
    }
    protected executeBitwiseXor(expression: BitwiseXorExpression) {
        return this.execute(expression.leftOperand) ^ this.execute(expression.rightOperand);
    }
    protected executeBitwiseXorAssignment(expression: BitwiseXorAssignmentExpression) {
        const value = this.scopeParameters.get<number>(expression.leftOperand.name) ^ this.execute(expression.rightOperand);
        this.scopeParameters.remove(expression.leftOperand.name);
        this.scopeParameters.add(expression.leftOperand.name, value);
        return value;
    }
    protected executeBitwiseZeroLeftShift(expression: BitwiseZeroLeftShiftExpression) {
        return this.execute(expression.leftOperand) << this.execute(expression.rightOperand);
    }
    protected executeBitwiseZeroLeftShiftAssignment(expression: BitwiseZeroLeftShiftAssignmentExpression) {
        const value = this.scopeParameters.get<number>(expression.leftOperand.name) << this.execute(expression.rightOperand);
        this.scopeParameters.remove(expression.leftOperand.name);
        this.scopeParameters.add(expression.leftOperand.name, value);
        return value;
    }
    protected executeBitwiseZeroRightShift(expression: BitwiseZeroRightShiftExpression) {
        return this.execute(expression.leftOperand) >> this.execute(expression.rightOperand);
    }
    protected executeBitwiseZeroRightShiftAssignment(expression: BitwiseZeroRightShiftAssignmentExpression) {
        const value = this.scopeParameters.get<number>(expression.leftOperand.name) >> this.execute(expression.rightOperand);
        this.scopeParameters.remove(expression.leftOperand.name);
        this.scopeParameters.add(expression.leftOperand.name, value);
        return value;
    }
    protected executeDivision(expression: DivisionExpression) {
        return this.execute(expression.leftOperand) / this.execute(expression.rightOperand);
    }
    protected executeDivisionAssignment(expression: DivisionAssignmentExpression) {
        const value = this.scopeParameters.get<number>(expression.leftOperand.name) / this.execute(expression.rightOperand);
        this.scopeParameters.remove(expression.leftOperand.name);
        this.scopeParameters.add(expression.leftOperand.name, value);
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
        const value = this.scopeParameters.get<number>(expression.leftOperand.name) ** this.execute(expression.rightOperand);
        this.scopeParameters.remove(expression.leftOperand.name);
        this.scopeParameters.add(expression.leftOperand.name, value);
        return value;
    }
    protected executeFunctionCall<T>(expression: FunctionCallExpression<T>): T {
        const params: unknown[] = [];
        for (const param of expression.params) {
            params.push(this.execute(param));
        }
        const fn = this.execute(expression.fnExpression);
        return fn(...params);
    }
    protected executeGreaterEqual(expression: GreaterEqualExpression) {
        return this.execute(expression.leftOperand) >= this.execute(expression.rightOperand);
    }
    protected executeGreaterThan(expression: GreaterThanExpression) {
        return this.execute(expression.leftOperand) > this.execute(expression.rightOperand);
    }
    protected executeInstanceof<T>(expression: InstanceofExpression<T>) {
        return this.execute(expression.leftOperand) instanceof this.execute(expression.rightOperand);
    }
    protected executeInstantiation<T>(expression: InstantiationExpression<T>): T {
        const params: unknown[] = [];
        for (const param of expression.params) {
            params.push(this.execute(param));
        }
        const type = this.execute(expression.typeOperand);
        return new type(...params);
    }
    protected executeLeftDecrement(expression: LeftDecrementExpression) {
        const value = this.executeParameter(expression.operand) - 1;
        this.scopeParameters.remove(expression.operand.name);
        this.scopeParameters.add(expression.operand.name, value);
        return value;
    }
    protected executeLeftIncrement(expression: LeftIncrementExpression) {
        const value = this.executeParameter(expression.operand) + 1;
        this.scopeParameters.remove(expression.operand.name);
        this.scopeParameters.add(expression.operand.name, value);
        return value;
    }
    protected executeLessEqual(expression: LessEqualExpression) {
        return this.execute(expression.leftOperand) <= this.execute(expression.rightOperand);
    }
    protected executeLessThan(expression: LessThanExpression) {
        return this.execute(expression.leftOperand) < this.execute(expression.rightOperand);
    }
    protected executeMemberAccess<TE, K extends StringKeyOf<TE>>(expression: MemberAccessExpression<TE, K>) {
        return this.execute(expression.objectOperand)[expression.memberName];
    }
    protected executeMethodCall<TE, K extends MethodKey<TE>, T extends MethodReturnType<TE, K>>(expression: MethodCallExpression<TE, K, T>): T {
        const params = [];
        for (const param of expression.params) {
            params.push(this.execute(param));
        }

        const obj = this.execute(expression.objectOperand);
        const method = obj[expression.methodName] as TE[K] & ((...params: unknown[]) => T);
        return method.apply(obj, params);
    }
    protected executeModulus(expression: ModulusExpression) {
        return this.execute(expression.leftOperand) % this.execute(expression.rightOperand);
    }
    protected executeModulusAssignment(expression: ModulusAssignmentExpression) {
        const value = this.scopeParameters.get<number>(expression.leftOperand.name) % this.execute(expression.rightOperand);
        this.scopeParameters.remove(expression.leftOperand.name);
        this.scopeParameters.add(expression.leftOperand.name, value);
        return value;
    }
    protected executeMultiplication(expression: MultiplicationExpression) {
        return this.execute(expression.leftOperand) * this.execute(expression.rightOperand);
    }
    protected executeMultiplicationAssignment(expression: MultiplicationAssignmentExpression) {
        const value = this.scopeParameters.get<number>(expression.leftOperand.name) * this.execute(expression.rightOperand);
        this.scopeParameters.remove(expression.leftOperand.name);
        this.scopeParameters.add(expression.leftOperand.name, value);
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
        return this.scopeParameters.get(expression.name);
    }
    protected executeRightDecrement(expression: RightDecrementExpression) {
        const value = this.executeParameter(expression.operand);
        this.scopeParameters.remove(expression.operand.name);
        this.scopeParameters.add(expression.operand.name, value - 1);
        return value;
    }
    protected executeRightIncrement(expression: RightIncrementExpression) {
        const value = this.executeParameter(expression.operand);
        this.scopeParameters.remove(expression.operand.name);
        this.scopeParameters.add(expression.operand.name, value + 1);
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
                    result += this.execute(exp) as string;
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
        const value = this.scopeParameters.get<number>(expression.leftOperand.name) - this.execute(expression.rightOperand);
        this.scopeParameters.remove(expression.leftOperand.name);
        this.scopeParameters.add(expression.leftOperand.name, value);
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
