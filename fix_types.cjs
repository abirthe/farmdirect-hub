const fs = require("fs");
let c = fs.readFileSync("src/pages/FarmRegister.tsx", "utf8");

c = c.replace(
  /const res = await Promise.race\(\[insertPromise, timeout\(8000\)\]\);\s*data = res\.data;\s*error = res\.error;/,
  `const res = (await Promise.race([insertPromise, timeout(8000)])) as { data: any; error: any };
        data = res.data;
        error = res.error;`
);

c = c.replace(
  /const retryRes = await Promise.race\(\[retryPromise, timeout\(10000\)\]\);\s*data = retryRes\.data;\s*error = retryRes\.error;/,
  `const retryRes = (await Promise.race([retryPromise, timeout(10000)])) as { data: any; error: any };
          data = retryRes.data;
          error = retryRes.error;`
);

c = c.replace(/catch \(err\) \{/, "catch (err: unknown) {");

fs.writeFileSync("src/pages/FarmRegister.tsx", c);

