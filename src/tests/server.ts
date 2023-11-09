import { preventTreeShaking } from "../lib/tree-shaking.js";
import { message } from "./shared.js";

preventTreeShaking(onOpen);

function onOpen() {
    const foo = 23;
    const bar = message;
}
