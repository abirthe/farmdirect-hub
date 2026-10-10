const fs = require("fs");
let c = fs.readFileSync("src/pages/FarmRegister.tsx", "utf8");

c = c.replace(/as \{ data: any; error: any \}/g, "as { data: unknown; error: unknown }");

fs.writeFileSync("src/pages/FarmRegister.tsx", c);

