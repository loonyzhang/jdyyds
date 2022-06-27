import axios from "axios";

export default class QLService {
  constructor(apiPrefix = "http://127.0.0.1:5600") {
    this.replyCount = 0;
    this.token = '';
    this.token_type = ''
    this.instance = axios.create({
      baseURL: apiPrefix,
    });
    this.instance.interceptors.request.use((config) => {
      config.headers['Authorization'] = `${this.token_type} ${this.token}`;
      return config;
    })
    this.instance.interceptors.response.use((response) => {
      return response;
    }, async (error) => {
      if (error.response.status === 401) {
        if (this.replyCount < 1) {
          console.log('重试一次');
          this.replyCount += 1;
          await this.initToken();
          return this.instance(error.response.config);
        } else {
          return Promise.reject(error);
        }
      }
      return Promise.reject(error);
    });
  }
  async initToken() {
    const {data: res} = await this.instance({
      url: '/open/auth/token',
      method: 'get',
      params: {
        client_id: '6Awe7pwp3_kv',
        client_secret: 't6YBivBpBvB_MaMB33CJsRSO'
      }
    });
    if (res.code === 200) {
      this.token = res.data.token;
      this.token_type = res.data.token_type;
    }
  }
  async getEnvs(isValid) {
    const {data: res} = await this.instance({
      url: "/open/envs",
      params: {
        searchValue: "JD_COOKIE",
        t: Date.now(),
      }
    });
    const result = isValid ? res.data.filter((item) => item.status === 0) : res.data
    return result
  }
  async addEnv(cookie, remarks) {
    const {data: res} = await this.instance({
      method: "post",
      url: "/open/envs",
      params: { t: Date.now() },
      data: [
        {
          name: "JD_COOKIE",
          value: cookie,
          remarks: remarks ?? '',
        },
      ],
    });
    return res;
  }
  async updateEnv(id, cookie, remarks) {
    const {data: res} = await this.instance({
      method: "put",
      url: "/open/envs",
      params: { t: Date.now() },
      data: {
        name: "JD_COOKIE",
        value: cookie,
        id: id,
        remarks,
      },
    });
    const updateId = res.data.id;
    const {data: res2} = await this.instance({
      method: "put",
      url: "/open/envs/enable",
      params: { t: Date.now() },
      data: [updateId],
    });
    return res2;
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
}
