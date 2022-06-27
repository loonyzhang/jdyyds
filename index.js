import meow from "meow";

import Koa from "koa";
import Router from "@koa/router";
import cors from "@koa/cors";
import koabody from "koa-body";
import QLService from "./ql.js";

const cli = meow({
  importMeta: import.meta,
  flags: {
    qinglong: {
      type: "string",
      alias: "ql",
      default: "http://127.0.0.1:9001",
    },
  },
});

const ql = new QLService(cli.flags.qinglong);

init();

function calcDay(start) {
  const dayTime = 24 * 60 * 60 * 1000;
  return Math.ceil((Date.now() - start) / dayTime);
}

async function init() {
  const STARTDATE = '2021-12-24';

  const app = new Koa();
  const router = new Router();
  router.get("/api/v1/info", async (ctx, next) => {
    const res = await ql.getEnvs(true);
    const len = res.length;
    ctx.body = {
      code: 0,
      msg: "success",
      data: {
        users: len,
        day: calcDay(new Date(STARTDATE).getTime()),
      },
    };
  });
  router.post("/api/v1/info", async (ctx, next) => {
    const pt_key = ctx.request.body.pt_key;
    const pt_pin = ctx.request.body.pt_pin;
    const remarks = ctx.request.body.remarks;
    if (!pt_key || !pt_pin) {
      ctx.body = {
        code: 1,
        msg: "params error",
        data: null,
      };
      return;
    }
    const cur = await ql.getEnvByPtPin(pt_pin);
    const cookie = `pt_pin=${pt_pin};pt_key=${pt_key};`
    if (cur) {
      const res = await ql.updateEnv(cur.id, cookie, remarks ?? cur.remarks);
      if (res.code === 200) {
        const all = await ql.getEnvs(true);
        ctx.body = {
          code: 0,
          msg: "success",
          data: {
            users: all.length,
            day: calcDay(new Date(STARTDATE).getTime()),
          },
        };
      } else {
        ctx.body = {
          code: 1,
          msg: "update error",
          data: null,
        };
      }
    } else {
      const res = await ql.addEnv(cookie, remarks || '')
      if (res.code === 200) {
        const all = await ql.getEnvs(true);
        ctx.body = {
          code: 0,
          msg: "success",
          data: {
            users: all.length,
            day: calcDay(new Date(STARTDATE).getTime()),
          },
        };
      } else {
        ctx.body = {
          code: 1,
          msg: "add error",
          data: null,
        };
      }
    }
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

  app.listen(9000, () => {
    console.log(`Server running at http://127.0.0.1:9000/`);
  });
}
