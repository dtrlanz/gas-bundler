import { message } from "./shared.js";

(globalThis as any).onOpen = onOpen;
function onOpen() {
    const foo = 23;
    const bar = message;
}
