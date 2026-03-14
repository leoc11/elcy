import { hashCode } from "../../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder";
import { FunctionExpression } from "./FunctionExpression";

export class LazyFunctionExpression extends FunctionExpression<any, any>
{
  constructor(private readonly fnString: string, hashCode?: number){
    super();
    this._hashCode = hashCode;
  }

  private _hashCode?: number;
  private _fnExp: FunctionExpression<any, any>;
  protected get fnExp(){
    if(!this._fnExp){
      this._fnExp = ExpressionBuilder.parse(this.fnString) as FunctionExpression<any, any>;
    }
    return this._fnExp;
  }

  public override get body(){
    return this.fnExp.body;
  }
  public override get params(){
    return this.fnExp.params;
  }
  public override get returnType(){
    return this.fnExp.returnType;
  }
  public override get type(){
    return this.fnExp.type;
  }
  override hashCode(): number {
    if(typeof this._hashCode === "number"){
      return this._hashCode;
    }

    return hashCode(this.fnString);
  }
}
