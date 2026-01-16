import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import productsRouter from "./routes/products";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (c) => c.json({ message: "Products CRUD API" }));
app.route("/api/products", productsRouter);

export default app; // Node.js serverless funciona así con Vercel
