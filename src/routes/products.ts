import { Hono } from "hono";
import { db } from "../db";
import { products } from "../db/schema";
import { eq, ilike, or } from "drizzle-orm";

const productsRouter = new Hono();

productsRouter.get("/", async (c) => {
  try {
    const search = c.req.query("search");

    let result;
    if (search) {
      result = await db
        .select()
        .from(products)
        .where(
          or(
            ilike(products.name, `%${search}%`),
            ilike(products.description, `%${search}%`),
            ilike(products.category, `%${search}%`)
          )
        );
    } else {
      result = await db.select().from(products);
    }

    return c.json(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    return c.json({ error: "Error al obtener productos" }, 500);
  }
});

productsRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.select().from(products).where(eq(products.id, id));

    if (result.length === 0) {
      return c.json({ error: "Producto no encontrado" }, 404);
    }

    return c.json(result[0]);
  } catch (error) {
    return c.json({ error: "Error al obtener producto" }, 500);
  }
});

productsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.name || !body.price || !body.description || !body.category) {
      return c.json(
        { error: "Campos requeridos: name, price, description, category" },
        400
      );
    }

    const newProduct = {
      id: Date.now().toString(),
      name: body.name,
      price: Number(body.price),
      description: body.description,
      category: body.category,
      image: body.image || `https://picsum.photos/seed/${Date.now()}/400/300`,
    };

    const result = await db.insert(products).values(newProduct).returning();

    return c.json(result[0], 201);
  } catch (error) {
    return c.json({ error: "Error al crear producto" }, 500);
  }
});

productsRouter.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const existing = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (existing.length === 0) {
      return c.json({ error: "Producto no encontrado" }, 404);
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name) updateData.name = body.name;
    if (body.price) updateData.price = Number(body.price);
    if (body.description) updateData.description = body.description;
    if (body.category) updateData.category = body.category;
    if (body.image) updateData.image = body.image;

    const result = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    return c.json(result[0]);
  } catch (error) {
    return c.json({ error: "Error al actualizar producto" }, 500);
  }
});

productsRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const existing = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (existing.length === 0) {
      return c.json({ error: "Producto no encontrado" }, 404);
    }

    await db.delete(products).where(eq(products.id, id));

    return c.json({ message: "Producto eliminado exitosamente" });
  } catch (error) {
    return c.json({ error: "Error al eliminar producto" }, 500);
  }
});

export default productsRouter;
