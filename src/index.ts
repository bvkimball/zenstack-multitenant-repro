import { PrismaClient } from "@prisma/client";
import { withPresets } from "@zenstackhq/runtime";
import RestApiHandler from "@zenstackhq/server/api/rest";
import { ZenStackMiddleware } from "@zenstackhq/server/express";
import express from "express";
import morgan from "morgan";

const app = express();

app.use(express.json());
app.use(morgan("tiny"));

const prisma = new PrismaClient();
app.use(
  "/api",
  ZenStackMiddleware({
    getPrisma: (req) =>
      withPresets(prisma, {
        user: { id: req.header("X-USER-ID") },
      }),
    handler: RestApiHandler({ endpoint: "http://localhost:3000/api" }),
  })
);

app.get("/test", async (req, res) => {
  const client = withPresets(
    prisma,
    {
      user: { id: req.header("X-USER-ID") },
    },
    { logPrismaQuery: true }
  );

  const result = await client.post.findMany({
    where: {},
    select: {
      id: true,
      content: true,
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
      comments: {
        select: {
          id: true,
          content: true,
        },
      },
    },
  });

  res.json(result);
});

app.use((req, res, next) => {
  const userId = req.header("X-USER-ID");
  if (!userId) {
    res.status(403).json({ error: "unauthorized" });
  } else {
    next();
  }
});

app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`)
);
