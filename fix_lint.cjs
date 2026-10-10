const fs = require("fs");
let c = fs.readFileSync("src/pages/FarmRegister.tsx", "utf8");
c = c.replace(/\} \/\/ eslint-disable-next-line @typescript-eslint\/no-explicit-any\r?\n\s*\} catch \(err: any\) \{/, "} catch (err: unknown) {");
c = c.replace(/if \(err\?\.message\?\.includes\("Lock"\) \|\| err\?\.name === "AbortError"\) \{/, "if (err instanceof Error && (err.message.includes(\"Lock\") || err.name === \"AbortError\")) {");
fs.writeFileSync("src/pages/FarmRegister.tsx", c);

