const Koa = require('koa');
const Busboy = require('busboy');
const fs = require('fs');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const Router = require('koa-router');

const app = new Koa();
const router = new Router();

router.get('/health', (ctx, next) => {
  ctx.body = { status: 'OK' };
});

app.use(router.routes());

app.use(async (ctx) => {
  if (ctx.method === 'POST') {
    const busboy = new Busboy({ headers: ctx.req.headers });

    let images = [];
    let imageCount = 0;
    try {
      busboy.on('file', (fieldname, file, filename) => {
        const filePath = `./${fieldname}.png`;
        file.pipe(fs.createWriteStream(filePath));
        images.push(filePath);
        imageCount++;

        if (imageCount === 2) {
          const img1 = fs
            .createReadStream(images[0])
            .pipe(new PNG())
            .on('parsed', doneReading);
          const img2 = fs
            .createReadStream(images[1])
            .pipe(new PNG())
            .on('parsed', doneReading);

          function doneReading() {
            if (--imageCount > 0) return;

            const diff = new PNG({ width: img1.width, height: img1.height });
            const numDiffPixels = pixelmatch(
              img1.data,
              img2.data,
              diff.data,
              img1.width,
              img1.height,
              { threshold: 0.1 }
            );

            ctx.body = `Number of different pixels: ${numDiffPixels}`;
          }
        }
      });

      ctx.req.pipe(busboy);
    } catch (err) {
      console.error(err);
    }
  } else if (ctx.method === 'GET') {
  }

  {
    ctx.status = 405;
    ctx.body = 'Method Not Allowed';
  }
});

app.listen(8000, () => {
  console.log('Server is running on http://localhost:8000');
});
