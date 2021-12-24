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