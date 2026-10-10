const fs = require("fs");
let c = fs.readFileSync("src/pages/FarmRegister.tsx", "utf8");

const replacement = `
      let data, error;
      try {
        const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), ms));
        
        const insertPromise = supabase.from("farms").insert([
          { 
            user_id: user.id, 
            farm_name: form.farmName || "Unnamed Farm Block", 
            location_name: form.location, 
            total_hectares: parseFloat(form.area) || null,
            boundary_coordinates: form.boundary 
          }
        ]);
        
        const res = await Promise.race([insertPromise, timeout(8000)]);
        data = res.data;
        error = res.error;
      } catch (err) {
        if (err instanceof Error && (err.message.includes("Lock") || err.name === "AbortError" || err.message.includes("timed out"))) {
          console.warn("Transient error or timeout, retrying...");
          const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), ms));
          const retryPromise = supabase.from("farms").insert([
            { 
              user_id: user.id, 
              farm_name: form.farmName || "Unnamed Farm Block", 
              location_name: form.location, 
              total_hectares: parseFloat(form.area) || null,
              boundary_coordinates: form.boundary 
            }
          ]);
          const retryRes = await Promise.race([retryPromise, timeout(10000)]);
          data = retryRes.data;
          error = retryRes.error;
        } else {
          throw err;
        }
      }
`;

// We will regex replace the whole inner try-catch block
const regex = /let data, error;\s*try \{[^]*?\} catch \(err: unknown\) \{[^]*?\} else \{[^]*?throw err;\[^]*?\}[^]*?\}/;
c = c.replace(/let data, error;\s*try \{[^]+?\}\s*catch \(err: unknown\) \{[^]+?\}\s*\}/, replacement.trim());
fs.writeFileSync("src/pages/FarmRegister.tsx", c);

