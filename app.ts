import { ExpressionBuilder } from "./src/ExpressionBuilder/ExpressionBuilder";

const expressionBuilder = new ExpressionBuilder();
const result = expressionBuilder.Parse('{Prop1: 123, Prop2: "345", Prop3: "1" + 2 + 3}');
// tslint:disable-next-line:no-console
console.log(result);
