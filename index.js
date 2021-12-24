import { join, dirname, normalize } from "path";
import fs from "fs/promises";
import process from "process";
import { Low, JSONFile } from "lowdb";
import { fileURLToPath } from "url";
import meow from "meow";

import Koa from "koa";
import Router from "@koa/router";
import cors from "@koa/cors";
import koabody from "koa-body";

const cli = meow({
  importMeta: import.meta,
  flags: {
    port: {
      type: "string",
      alias: "p",
      default: "9000",
    },
    output: {
      type: "string",
      alias: "o",
      default: ".",
    },
    file: {
      type: "string",
      alias: "f",
      default: "jds.txt",
    },
  },
});
const __dirname = dirname(fileURLToPath(import.meta.url));

const file = join(__dirname, "db.json");
const adapter = new JSONFile(file);
const db = new Low(adapter);

const a = normalize(cli.flags.output);
const b = join(a, cli.flags.file)

init();

function calcDay(start) {
  const dayTime = 24 * 60 * 60 * 1000;
  return Math.ceil((Date.now() - start) / dayTime);
}

async function init() {
  await db.read();
  db.data = db.data || {
    users: {},
    startTime: Date.now(),
  };
  await db.write();

  const app = new Koa();
  const router = new Router();
  router.get("/api/v1/info", async (ctx, next) => {
    const len = Object.keys(db.data.users).length;
    ctx.body = {
      code: 0,
      msg: "success",
      data: {
        users: len,
        day: calcDay(db.data.startTime),
      },
    };
  });
  router.post("/api/v1/info", async (ctx, next) => {
    const pt_key = ctx.request.body.pt_key;
    const pt_pin = ctx.request.body.pt_pin;
    if (!pt_key || !pt_pin) {
      ctx.body = {
        code: 1,
        msg: "params error",
        data: null,
      };
      return;
    }
    db.data.users[pt_pin] = pt_key;
    await db.write();
    const len = Object.keys(db.data.users).length;
    ctx.body = {
      code: 0,
      msg: "success",
      data: {
        users: len,
        day: calcDay(db.data.startTime),
      },
    };
  });
  router.get("/api/v1/generate", async (ctx, next) => {
    const allCookies = Object.keys(db.data.users).map((pin) => {
      const key = db.data.users[pin];
      const cookie = `pt_pin=${pin};pt_key=${key};`;
      return cookie;
    });
    const filePath = normalize(cli.flags.output);
    await fs.writeFile(join(filePath, cli.flags.file), allCookies.join("\n"), {
      encoding: "utf8",
      flag: "w",
    });
    ctx.body = {
      code: 0,
      msg: "success",
      data: allCookies,
    };
  });
  app
    .use(
      cors({
        origin: "*",
      })
    )
    .use(koabody())
    .use(router.routes())
    .use(router.allowedMethods());

  app.listen(cli.flags.port, () => {
    console.log(`Server running at http://127.0.0.1:${cli.flags.port}/`);
  });
}
