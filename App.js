const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
const supportedLangs = ['FR', 'EN'];

app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));

nunjucks.configure([path.join(__dirname, 'View')], {
  autoescape: true,
  express: app,
  noCache: true,
});


app.use((req, res, next) => {
  const lang = req.query.lang;
  res.locals.lang = supportedLangs.includes(lang) ? lang : 'FR';
  next();
});


app.get('/', (req, res) => {
  res.render("FR/Index.njk");
});

app.get('/Projects', async (req, res) => {
  const lang = res.locals.lang;
  try {
    const projects = await prisma.project.findMany({
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

     console.log(projects);
    res.render("FR/Projects.njk", { projects });
  } catch (err) {
    console.error('Error loading projects:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/Projects/new', async (req, res) => {
  const tags = await prisma.tag.findMany();
  res.render(`${res.locals.lang}/NewProject.njk`, { tags });
});

app.post('/Projects', async (req, res) => {
  const { name, date, description, image, tagIds } = req.body;

  try {
    const newProject = await prisma.project.create({
      data: {
        name,
        date: new Date(date),
        description,
        image,
        tags: {
          create: (Array.isArray(tagIds) ? tagIds : [tagIds]).map(id => ({
            tag: { connect: { id: parseInt(id) } }
          })),
        },
      },
    });
    console.log("redirecting");
    res.redirect('/Projects');
  } catch (err) {
    console.log(err +"error on project")
    console.error('Error creating project:', err);
    res.status(500).send('Error creating project');
  }
});


app.get('/Portfolio', (req, res) => {
  res.render(`${res.locals.lang}/Portfolio.njk`);
});

app.listen(port, () => {
  console.log("Listening on port: " + port);
});
