脚本启动，生成 ck txt 到青龙目录

```node index.js -p 9000 -o YOURPATH/ql/config -f jds.txt```

在青龙 config.sh 里面添加 bash 脚本

```
FILE=/ql/config/jds.txt

if [ -f "$FILE" ]; then
  JD_COOKIE=`cat "$FILE"`
  echo $JD_COOKIE
  if [ -n "$JD_COOKIE" ]; then
    export JD_COOKIE
  fi
fi
```
添加 cron 任务，定时输出cookie

```* */3 * * * curl -fsSL 'http://127.0.0.1:9002/api/v1/generate' > /dev/null 2>&1```
