# π walks into a bar 

Evaluator of mathmetical expressions.

Converts given mathematical expression in infix notation to reverse polish notation using [Shunting-yard algorithm](https://en.wikipedia.org/wiki/Shunting-yard_algorithm) and evaluates it with specified variables and functions.



Tokenization is performed using my other module [tokenizer2000](https://github.com/flerokoo/tokenizer2000)

## Why?

See __Why?__ section of the [tokenizer2000](https://github.com/flerokoo/tokenizer2000). Also to impress girls (lol)



## Usage

No one will ever use this, but nonetheless: 

```js

let parse = require("pi-walks-into-a-bar");

let result = parse("2*sin(pi/2) + 5**(2*ctg(x))").evaluate([
    {
        type: "function",
        name: "sin",
        length: 1,
        execute: arg => Math.sin(arg)
    },
    {
        type: "function",
        name: "cos",
        length: 1,
        execute: arg => Math.cos(arg)
    },
    {
        type: "function",
        name: "tan",
        length: 1,
        execute: arg => Math.tan(arg)
    },
    {
        type: "function",
        name: "ctg",
        length: 1,
        execute: arg => 1/Math.tan(arg)
    },
    {
        type: "variable",
        name: "pi",
        value: Math.PI
    },
    {
        type: "variable",
        name: "e",
        value: Math.exp(1)
    },
    {
        type: "variable",
        name: "x",
        value: 2
    },
    
]);


```
