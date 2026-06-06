import type { GenericType } from "src/Common/Type";
import { hashCode } from "../../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder";
import { FunctionExpression } from "./FunctionExpression";

export class LazyFunctionExpression<T = unknown, TArgs extends readonly unknown[] = []> extends FunctionExpression<T, TArgs> {
  constructor(fn: (...args: TArgs) => T, argTypes?: { [K in keyof TArgs]: GenericType<TArgs[K]> }, hashCode?: number)
  constructor(fn: string, hashCode?: number);
  constructor(fn: string | ((...args: TArgs) => T), argTypesOrHasCode?: number | { [K in keyof TArgs]: GenericType<TArgs[K]> }, hashCode?: number) {
    super();
    if (typeof fn === "string") {
      this.fnString = fn;
    }
    else {
      this.fnString = fn.toString();
    }
    if (typeof argTypesOrHasCode === "number") {
      this._hashCode = argTypesOrHasCode;
    }
    else {
      this.paramTypes = argTypesOrHasCode;
    }
  }

  private readonly paramTypes: { [K in keyof TArgs]: GenericType<TArgs[K]> };
  private readonly fnString: string;
  private _hashCode?: number;
  private _fnExp: FunctionExpression<T, TArgs>;
  protected get fnExp() {
    if (!this._fnExp) {
      this._fnExp = ExpressionBuilder.parse(this.fnString, this.paramTypes as GenericType[] ?? []) as FunctionExpression<T, TArgs>;
    }
    return this._fnExp;
  }

  public override get body() {
    return this.fnExp.body;
  }
  public override set body(value) {}
  public override get params() {
    return this.fnExp.params;
  }
  public override set params(value) {}
  public override get returnType() {
    return this.fnExp.returnType;
  }
  public override set returnType(value) {}
  public override get type() {
    return this.fnExp.type;
  }
  public override set type(value) {}

  override hashCode(): number {
    if (typeof this._hashCode === "number") {
      return this._hashCode;
    }

    return hashCode(this.fnString);
  }
}
