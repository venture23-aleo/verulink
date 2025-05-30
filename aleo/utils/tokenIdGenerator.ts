import { leo2js } from "@doko-js/core";
import { hash } from "aleo-hasher";
import { wethName, wusdcName, wusdtName } from "./testdata.data";

const wusdc_id = leo2js.field(hash('bhp256', wusdcName.toString() + "u128", "field"));
const wusdt_id = leo2js.field(hash('bhp256', wusdtName.toString() + "u128", 'field'));
const weth_id = leo2js.field(hash('bhp256', wethName.toString() + "u128", 'field'));

console.log(wusdc_id.toString());
console.log(wusdt_id.toString());
console.log(weth_id.toString());