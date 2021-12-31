import got from "got";
import { readFile } from "fs/promises";
import path from "path";

export default class QLService {
  constructor(dir = "/ql", apiPrefix = "http://127.0.0.1:5600") {
    this.dir = dir;
    this.authFile = path.join(dir, "config/auth.json");
    this.api = got.extend({
      prefixUrl: apiPrefix,
      retry: { limit: 0 },
    });
  }
  async getToken() {
    const authConfig = JSON.parse(await readFile(this.authFile));
    return authConfig.token;
  }
  async getEnvs() {
    const token = await this.getToken();
    const body = await this.api({
      url: "api/envs",
      searchParams: {
        searchValue: "JD_COOKIE2",
        t: Date.now(),
      },
      headers: {
        Accept: "application/json",
        authorization: `Bearer ${token}`,
      },
    }).json();
    return body.data;
  }
  async addEnv(cookie, remarks) {
    const token = await this.getToken();
    const body = await this.api({
      method: "post",
      url: "api/envs",
      searchParams: { t: Date.now() },
      json: [
        {
          name: "JD_COOKIE",
          value: cookie,
          remarks,
        },
      ],
      headers: {
        Accept: "application/json",
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json;charset=UTF-8",
      },
    }).json();
    return body;
  }
  async updateEnv(cookie, eid, remarks) {
    const token = await this.getToken();
    const body = await this.api({
      method: "put",
      url: "api/envs",
      searchParams: { t: Date.now() },
      json: {
        name: "JD_COOKIE",
        value: cookie,
        _id: eid,
        remarks,
      },
      headers: {
        Accept: "application/json",
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json;charset=UTF-8",
      },
    }).json();
    return body;
  }
  async getEnvByPtPin(ptpin) {
    const envs = await this.getEnvs();
    for (let i = 0; i < envs.length; i++) {
      var tempptpin = decodeURIComponent(
        envs[i].value.match(/pt_pin=([^; ]+)(?=;?)/) &&
          envs[i].value.match(/pt_pin=([^; ]+)(?=;?)/)[1]
      );
      if (tempptpin == ptpin) {
        return envs[i];
      }
    }
    return "";
  }
  /**
   *
   * @param {
   *   value: CK,
   *   remarks: 备注
   * } envArr
   * @returns
   */
  async addAllEnv(envArr) {
    envArr = envArr.map((item) => {
      return {
        ...item,
        name: "JD_COOKIE2",
      };
    });
    const token = await this.getToken();
    const body = await this.api({
      method: "post",
      url: "api/envs",
      searchParams: { t: Date.now() },
      json: envArr,
      headers: {
        Accept: "application/json",
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json;charset=UTF-8",
      },
    }).json();
    return body;
  }
  async delAllEnv() {
    const token = await this.getToken();
    const envs = await this.getEnvs();
    const allEids = envs.map((item) => item._id) || [];
    if (allEids.length > 0) {
      const body = await this.api({
        method: "delete",
        url: "api/envs",
        searchParams: { t: Date.now() },
        body: JSON.stringify(allEids),
        headers: {
          Accept: "application/json",
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json;charset=UTF-8",
        },
      }).json();
      return body;
    } else {
      return { code: 200 };
    }
  }
}
