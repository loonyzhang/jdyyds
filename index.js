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
import QLService from "./ql.js";

const ql = new QLService("/root/ql", "http://127.0.0.1:9001");

const cli = meow({
  importMeta: import.meta,
  flags: {
    port: {
      type: "string",
      alias: "p",
      default: "9000",
    },
  },
});
const __dirname = dirname(fileURLToPath(import.meta.url));

const file = join(__dirname, "db.json");
const adapter = new JSONFile(file);
const db = new Low(adapter);

init();

function calcDay(start) {
  const dayTime = 24 * 60 * 60 * 1000;
  return Math.ceil((Date.now() - start) / dayTime);
}

async function init() {
  await db.read();
  /**
   * users: {
   *  pt_pin: {
   *    pt_key: 'xxx',
   *    remarks: 备注
   *  }
   * }
   * startTime: timestamp
   */
  db.data = db.data || {
    users: {},
    startTime: Date.now(),
    shouldUpdate: true,
  };
  await db.write();

  const app = new Koa();
  const router = new Router();
  router.get("/api/v1/info", async (ctx, next) => {
    await db.read();
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
    const remarks = ctx.request.body.remarks || "";
    if (!pt_key || !pt_pin) {
      ctx.body = {
        code: 1,
        msg: "params error",
        data: null,
      };
      return;
    }
    db.data.users[pt_pin] = {
      pt_key,
      remarks,
    };
    db.data.shouldUpdate = true;
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
    await db.read();
    if (!db.data.shouldUpdate) {
      ctx.body = {
        code: 0,
        msg: "no need to update",
        data: null,
      };
      return;
    }
    const allCookies = Object.keys(db.data.users).map((pin) => {
      const val = db.data.users[pin];
      const key = val.pt_key;
      const remarks = val.remarks;
      return {
        value: `pt_pin=${pin};pt_key=${key};`,
        remarks,
      };
    });
    const delRes = await ql.delAllEnv();
    const addRes = await ql.addAllEnv(allCookies);
    db.data.shouldUpdate = false;
    ctx.body = {
      code: 0,
      msg: "success",
      data: {
        delRes,
        addRes,
      },
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
