import express from 'express';
import path from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import errorHandler from 'error-handler';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import * as prismic from '@prismicio/client';
import PrismicDOM from 'prismic-dom';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const initAPI = (req) => {
  const client = prismic.createClient(process.env.PRISMIC_REPO_NAME, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  return client;
};

const handleLinkResolver = (doc) => {
  return '/';
};

app.use((req, res, next) => {
  res.locals.ctx = {
    endpoint: process.env.PRISMIC_ENDPOINT,
    linkResolver: handleLinkResolver,
  };

  res.locals.PrismicDOM = PrismicDOM;
  next();
});

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(methodOverrride())
app.use(errorHandler());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.render('pages/home', { title: 'My Vite Express App' });
});
//　About page
app.get('/about', async (req, res) => {
  try {
    const client = initAPI(req);
    const response = await client.getByType('about');

    const { results } = response;
    const { data } = results[0];
    res.render('pages/about', {
      document: data,
      title: 'My Vite Express App',
    });
  } catch (err) {
    console.error('Prismic error:', err);
    res.status(500).send('Error fetching Prismic content.');
  }
});

//　Detail page
app.get('/detail/:id', async (req, res) => {
  try {
    const client = initAPI(req);
    // const meta = await client.getSingle("metadata");
    const product = await client.getByUID('product', req.params.id);
    if (!product) {
      return res.status(404).render('pages/404', {
        title: 'Page Not Found',
        message: 'The product you are looking for does not exist.',
      });
    }
    console.log(JSON.stringify(product.data.informations, null, 2));
    res.render('pages/detail', {
      product,
    });
  } catch (err) {
    if (err.name === 'NotFoundError') {
      return res.status(404).render('pages/404', {
        title: 'Page Not Found',
        message: 'The product you are looking for does not exist.',
      });
    }

    console.error('Prismic error:', err);
    res.status(500).send('Error fetching product detail.');
  }
});

// Collections
app.get('/collections', async (req, res) => {
  try {
    const client = initAPI(req);
    const collections = await client.getAllByType('collection');
    const homeData = await client.getAllByType('home');
    const home = homeData[0];
    const preloader = await client.getSingle('preloader');
    if (!collections || !home) {
      return res.status(404).render('pages/404', {
        title: 'Page Not Found',
        message: 'The product you are looking for does not exist.',
      });
    }

    res.render('pages/collections', {
      collections,
      home,
      preloader,
    });
  } catch (err) {
    if (err.name === 'NotFoundError') {
      return res.status(404).render('pages/404', {
        title: 'Page Not Found',
        message: 'The product you are looking for does not exist.',
      });
    }

    console.error('Prismic error:', err);
    res.status(500).send('Error fetching product detail.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
