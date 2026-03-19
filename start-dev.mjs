import { pathToFileURL } from "url";
import { register } from "node:module";

// Register tsx loader
register("tsx/esm", pathToFileURL("./"));

// Start server
await import("./server/index.ts");
