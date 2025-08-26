const str = "Hello {{console.log(regex); return 'returned'}}}, here is another {{second}}}, and {{third}}}";
const regex = /\{\{(.*?)\}\}\}/g;

const matches = [...str.matchAll(regex)].map(m => m[1]);
let fn = new Function("regex", matches[0])
console.log(fn("this is regex"))
console.log(matches);