export class Json1 {
    name: string = "";
    number: number = 0;
    boolean: boolean = false;
    object: Json2 = new Json2();
    array: Json2[] = [];
}

export class Json2 {
    name: string = "empty";
    number: number = 2;
    boolean: boolean = true;
}