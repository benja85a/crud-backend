import { Hono } from "hono";
import { cors } from "hono/cors";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/node-postgres";
import { products } from "./db/schema";
import { eq } from "drizzle-orm";

const app = new Hono();

// ✅ CORS
app.use(
  "/api/*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type"],
  }),
);

// ✅ DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
const db = drizzle(pool);

// =====================
// GET ALL PRODUCTS
// =====================
app.get("/api/products", async (c) => {
  const allProducts = await db.select().from(products);
  return c.json(allProducts);
});

// =====================
// GET PRODUCT BY ID
// =====================
app.get("/api/products/:id", async (c) => {
  const { id } = c.req.param();

  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, Number(id)));

  if (!product.length) {
    return c.json({ error: "Product not found" }, 404);
  }

  return c.json(product[0]);
});

// =====================
// CREATE PRODUCT
// =====================
app.post("/api/products", async (c) => {
  const body = await c.req.json();

  const image =
    body.image && body.image.trim() !== ""
      ? body.image
      : `https://picsum.photos/seed/${Date.now()}/400/300`;

  const [newProduct] = await db
    .insert(products)
    .values({
      name: body.name,
      price: String(body.price),
      description: body.description,
      category: body.category,
      image,
    })
    .returning();

  return c.json(newProduct, 201);
});

// =====================
// UPDATE PRODUCT
// =====================
app.put("/api/products/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    const [updatedProduct] = await db
      .update(products)
      .set({
        name: body.name,
        price: body.price,
        description: body.description,
        category: body.category,
        image: body.image,
      })
      .where(eq(products.id, Number(id)))
      .returning();

    if (!updatedProduct) {
      return c.json({ error: "Product not found" }, 404);
    }

    return c.json(updatedProduct);
  } catch (err) {
    return c.json({ error: "Failed to update product", details: err }, 500);
  }
});

// =====================
// DELETE PRODUCT
// =====================
app.delete("/api/products/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const deleted = await db
      .delete(products)
      .where(eq(products.id, Number(id)))
      .returning();

    if (!deleted.length) {
      return c.json({ error: "Product not found" }, 404);
    }

    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: "Failed to delete product", details: err }, 500);
  }
});

export default app;
