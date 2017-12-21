import { Test } from "./Test";

declare module "./Test" {
    // tslint:disable-next-line:interface-name
    // tslint:disable-next-line:no-shadowed-variable
    interface Test {
        prop2: string;
    }
}

const a: Test = new Test();
a.prop1 = "";
a.prop2 = "";
