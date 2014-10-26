# for production, use this to get best performance
ulimit -n 9999

# kill existing process
pid=$(ps aux| grep 'node app.js' |grep -v grep| awk '{print $2}')
kill -9 $pid

# for dev, use nodemon
nodemon --watch ./app  --ext '.js|.css|.html|.jinjs'  app.js

