import { supabase } from "./lib/supabase.js";

const { data, error } = await supabase.from("projects").select("*").limit(1);

if (error) {
  console.error("Erro na query:", error.message);
} else {
  console.log("Query OK:", data);
}
