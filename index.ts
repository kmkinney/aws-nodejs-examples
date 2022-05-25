import express from 'express';
import compression from 'compression';
import { router } from './routes'

const app = express();


app.use(compression({
  level: -1,
  threshold: 1000,
}));

app.use('/', router);

app.use('/', (req, res) => {
  res.sendStatus(404);
});

app.listen(3000, () => {
  console.log(`APP LISTENING ON PORT 3000`);
})
