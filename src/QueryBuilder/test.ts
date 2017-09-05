var basic = (() => { 
    var eqexp = (param1, operator, param2) => { 
        if (operator == "==") {
            return param1 == param2;
        }
        else if (operator == ".") {
            return param1[param2];
        }
    }
    var eqexp2 = (param1, operator, param2) => { 
        var result = "";
        if (operator == "==") {
            result = param1 + "=" + param2;
        }
        else if (operator == ".") {
            result = param1 + "." + param2;
        }

        return "(" + result + ")";
    }
    var source = [];

    this.source = (array: any) => { 
        source = array;
    }

    var getParamName = (fn: Function, index : number) => { 
        var fnString = fn.toString();
        var regexp = new RegExp("[ ]*(function[ ]*)?[(]?([a-z][a-z0-9, \s]*)", "i");
        var result = fnString.match(regexp);
        result = result[2].split(",");
        var params = [];
        for (var i = 0; i < index && i < result.length; i++){
            params.push(result[i].trim());
        }

        return params;
    }
    var getFunctionBody = (fn: Function) => { 
        var fnString = fn.toString();
        return fnString.substring(fnString.indexOf('{') + 1, fnString.lastIndexOf("}") - 1);
    }

    var getNewFunction = (fn: Function, keepParam: number, addParams: object): Function => {
        var params = getParamName(fn, keepParam);
        var completeArguments = [];
        for (var paramname in addParams) {
            params.push(paramname);
            completeArguments.push(addParams[paramname]);
        }

        var body = getFunctionBody(fn);
        var fn1 = eval("((" + params.join(",") + ") => {" + body + "})");
        return function () {
            var args = [];
            for (var i = 0; i < keepParam; i++){
                if (arguments.length > i)
                    args.push(arguments[i]);
                else
                    args.push(undefined);
            }
            args = args.concat(completeArguments);
            return fn1.apply(this, args);
        };
    }

    this.where = (fn: Function, scope: any) => { 
        scope.eq = eqexp;
        var fn1 = getNewFunction(fn, 1, scope);
        let result = [];

        source.forEach((item) => {
            if (fn1(item))
                result.push(item);
        });
        return result;
    }
    
    this.where1 = (fn: Function, scope: any) => { 
        scope.eq = eqexp2;
        var fn1 = getNewFunction(fn, 1, scope);
        return fn1("TBL1");
    }
    
    return this;
})();



let button = document.createElement('button');
button.textContent = "Say Hello";
button.onclick = function () {
    var a = "1";
    basic.source([{ Name: "1" }, { Name: "2" }]);
    var result = basic.where1((o, eq, a) => {return eq(eq(o, ".", "Name"), "==", a);}, {a: a});
    console.log(result)
    alert(result);
}

document.body.appendChild(button);



function parse(fnBody: string){
   var blocks = [
       { Start: "(", End: ")", AllowInsideBlock: true },
       { Start: "\"", End: "\"", AllowInsideBlock: false },
       { Start: "'", End: "'", AllowInsideBlock: false },
       "&&",
       "||"
    ]

   var result = [];
   var currentBLock = "";
   var endBlocks = "";
   for (var i = 0; i < fnBody.length; i++){
       var char = fnBody[i];
       if (char == "(") {
           
       }
   }
}


// example expected usage
// will use proxy object like in where preparation.
IQueryable<Order> asd = OrderDatabase.Orders.Select(
    // select all property
    o=>o,

    // select included property
    o=>o.OrderId,
    o=>o.CreatedDate,
    o=>o.CreatedBy,

    // include
    o=>o.OrderDetails,
    o=>o.Customer,


    // include OrderDetails.Product.ProductType and filter and sort
    o=>o.OrderDetails.Select(od=>od.Product.ProductType)
        .Where(od=>od.Quantity >= 20)
        .SortBy(od=>od.Amount)
).Where(o=>o.Amount > 10).Finalize();


Enumerable<Order>([]).Select(...).Where(...).OrderBy(....).Skip(10).Take(10)
    .First()
    .Last()
    .Sum(),
    .Avg(),
    .Count(),
    .GroupBy()
        .OrderBy()
    .Finalize();

// to be consider
// .SelectObj<ObjectType>((<T>(source: T): any)): ObjectType
// .SelectMany<OT>((<T>(source: T): IQueryable<OT>)) : IQueryable<OT>

/// GetAll().Products.With("Name", "Id", "Price", "Orders.").Having("Name").Equal.to.("123")
//    .and.Having("Price").Over(23).End();