let tokenize = require("tokenizer2000");
let { rules, tokenTypes } = require("tokenizer2000/src/ruleset");

let operatorPrecedence = {
    "**": 3,
    "/" : 2,
    "*" : 2,
    "+": 1,
    "-": 1
}

let associativity = {
    "/" : "left",
    "*" : "left",
    "+": "left",
    "-": "left",
    "**": "right"
}

let getPrecedence = arr => {
    return arr.map(op => {
        let v = operatorPrecedence[op];
        if (!v) throw new Error("Unknown operator: " + v);
        return v;
    });
}

let operatorGt = (a, b) => {
    let [v1, v2] = getPrecedence([a, b])
    return v1 > v2;
}

let operatorGte = (a, b) => {
    let [v1, v2] = getPrecedence([a, b])
    return v1 >= v2;
}

let operatorEq = (a, b) => {
    let [v1, v2] = getPrecedence([a, b])
    return v1 == v2;
}

let operatorLt = (a, b) => {
    let [v1, v2] = getPrecedence([a, b])
    return v1 < v2;
}

let operatorLte = (a, b) => {
    let [v1, v2] = getPrecedence([a, b])
    return v1 <= v2;
}

let isLeftAssoc = op => {
    if (!associativity[op]) throw new Error("Unknown operator:" + op);
    return associativity[op] === 'left';
}

let isRightAssoc = op => !isLeftAssoc(op);


let infixToRPN = tokens => {
    let output = [];
    let operators = [];

    let last;

    let checkLastOp = fn => {
        if (operators.length === 0) return false;
        return fn(operators[operators.length - 1]);
    }
   
    tokens.forEach(token => {

        // console.log("####################")
        // console.log(token.value)
        // console.log("OPS " + operators.map(t => t.value).join(" "))
        // console.log("OUTPUT " + output.map(t => t.value).join(" "))

        switch (token.type) {
            case tokenTypes.LITERAL:
            case tokenTypes.VARIABLE:
                output.push(token);
                break;
            case tokenTypes.FUNCTION:
                operators.push(token);
                break;
            case tokenTypes.ARG_SEPARATOR:
                last = operators[operators.length - 1];
                while (last && last.type !== tokenTypes.LEFT_PAREN) {
                    output.push(operators.pop());
                    if (operators.length === 0) throw new Error("Cant find opening paren");
                    last = operators[operators.length - 1];
                }
                break;
            case tokenTypes.OPERATOR:
                last = operators[operators.length - 1];
                // while (last && ((last.type === tokenTypes.OPERATOR && operatorLt(last.value, token.value) && isLeftAssoc(token.value))
                //     || (last.type === tokenTypes.OPERATOR && operatorEq(last.value, token.value) && isRightAssoc(token.value)))
                //     && last.type !== tokenTypes.LEFT_PAREN) {
                while (last && last.type !== tokenTypes.LEFT_PAREN && (
                    (operatorGt(last.value, token.value) && isRightAssoc(token.value)) ||
                    (operatorGte(last.value, token.value) && isLeftAssoc(token.value)) 
                )) {
                    output.push(last);
                    operators.pop();
                    last = operators[operators.length - 1];
                }

                operators.push(token);
                break;
            case tokenTypes.LEFT_PAREN:
                operators.push(token);
                break;
            case tokenTypes.RIGHT_PAREN:
                last = operators[operators.length - 1];
                while (last && last.type !== tokenTypes.LEFT_PAREN) {
                    output.push(operators.pop());
                    last = operators[operators.length - 1];
                    if (operators.length === 0) {
                        throw new Error("Cant find left paren");
                    }
                }

                if (operators[operators.length - 1].type === tokenTypes.LEFT_PAREN) {
                    operators.pop();
                }

                if (operators.length > 0 && operators[operators.length - 1].type === tokenTypes.FUNCTION) {
                    output.push(operators.pop())    
                }

                break;
            default:
                throw new Error("Unknown token: " + token.type + " " + token.value);
        }
    });

    while (operators.length > 0) {
        if(operators[operators.length - 1] === tokenTypes.LEFT_PAREN) throw new Error("Unclosed paren")
        if (operators[operators.length - 1] === tokenTypes.RIGHT_PAREN) throw new Error("Closed paren")
        output.push(operators.pop())
    }

    return output;
}

let parse = expr => {
    console.log("##### " + expr)
    let tokens = tokenize(expr, rules);    
    let rpn = infixToRPN(tokens);

    return {
        rpn,
        tokens,
        evaluate: function(defines) {
            return evaluate(rpn, defines);
        },
        toString: function () {
            return rpn.map(t => t.value).join(" ");
        }
    }
}

let evaluate = (rpn, defines) => {   
    
    let stack = [];

    let lookupVariable = name => {
        let variable = defines.find(e => e.type == "variable" && e.name === name);
        if (!variable) throw new Error(`Variable ${name} not found`);
        return variable;
    }

    let lookupFunc = name => {
        let func = defines.find(e => e.type == "function" && e.name === name);
        if (!func) throw new Error(`Function ${name} not found`);
        return func;
    }

    rpn.forEach(token => {
        switch (token.type) {
            case tokenTypes.LITERAL:
                stack.push(token);
                break;
            case tokenTypes.VARIABLE:
                let variable = lookupVariable(token.value);
                stack.push({
                    type: tokenTypes.LITERAL,
                    value: variable.value
                });
                break;
            case tokenTypes.OPERATOR:
                let v2 = parseFloat(stack.pop().value);
                let v1 = parseFloat(stack.pop().value);

                let out = null;
                switch (token.value) {
                    case "+":
                        out = v1 + v2;
                        break;
                    case "-":
                        out = v1 - v2;
                        break;
                    case "/":
                        out = v1 / v2;
                        break;
                    case "*":
                        out = v1 * v2;
                        break;
                    case "**":
                        out = Math.pow(v1, v2);
                        break;
                    default:
                        throw new Error("Unknwon operator: " + token.value);
                }

                stack.push({
                    type: tokenTypes.LITERAL,
                    value: out
                })
                
                break;
            case tokenTypes.FUNCTION:
                let fn = lookupFunc(token.value);                
                let args = [];
                let i = 0;
                while (i < fn.length) {
                    if (stack.length === 0) throw new Error(`Cant execute ${token.value}: not enough arguments`);
                    args.push(parseFloat(stack.pop().value));
                    i++;
                }

                stack.push({
                    type: tokenTypes.LITERAL,
                    value: fn.execute(...args)
                });

                break;
            
        }
    }) 

    return stack[0].value;
}


let parsed = parse("sin(x)");

console.log(parsed + "")
console.log(parsed.evaluate([
    {
        type: "function",
        name: "sin",
        length: 1,
        execute: arg => Math.sin(arg)
    },
    {
        type: "variable",
        name: "x",
        value: 1
    }
]));
