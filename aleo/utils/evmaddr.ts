import {evm2AleoArr} from './ethAddress';

const address = evm2AleoArr("0xD342C031453c66A6D6c2a23D6dA86c30adA08C79");
let i=0;
let result = "[";
for (i=0; i< address.length;i++){
    let add = address[i].toString();
    add += "u8, ";
    result+= add;
}
result+="]";
console.log(result);

