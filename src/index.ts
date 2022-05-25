import express from 'express';
import compression from 'compression';
import { router as s3Router } from './s3/s3'
import config from 'config';

const app = express();
const port = process.env.PORT || 3000;

app.use(compression({
  level: -1,
  threshold: 1000,
}));

// Routes
app.use('/s3', s3Router);

app.get('/', (req, res) => {
  res.send('Server listening')
})

app.use('/', (req, res) => {
  res.sendStatus(404);
});

app.listen(port, () => {
  console.log(`AWS region: ${config.get('AWS.region')}`)
  console.log(`APP LISTENING ON PORT ${port}`);
})
