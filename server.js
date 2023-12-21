import express from 'express';
import router from './routes/index';

const port = process.env.EXPRESS_PORT || 5000;
const app = express();

app.use('/', router);
app.listen(port, (err) => {
  if (err) {
    console.error(`Error starting server: ${err}`);
  } else {
    console.log(`Server running on port ${port}`);
  }
});

export default app;
