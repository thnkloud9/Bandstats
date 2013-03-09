# for production, use this to get best performance
ulimit -n 9999
# for dev, use nodemon
nodemon --watch ./app  --ext '.js|.css|.html|.jinjs'  app.js

