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

const env = nunjucks.configure([path.join(__dirname, 'View')], {
  autoescape: true,
  express: app,
  noCache: true,
});


env.addFilter('yearMonth', yearMonthFilter);
env.addFilter('YearMonth', yearMonthFilter);

function yearMonthFilter(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}/${month}`;
}

app.use((req, res, next) => {
  const lang = req.query.lang;
  res.locals.lang = supportedLangs.includes(lang) ? lang : 'FR';
  next();
});


app.get('/', async (req, res) => {
  const projects = await prisma.project.findMany({
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

  res.render(`${res.locals.lang}/Index.njk`, {
    projects,
    lang: res.locals.lang 
  });
});

app.get('/Contacts', (req, res) => {
  res.render(`${res.locals.lang}/Contacts.njk`);
});

app.get('/Parcours', (req, res) => {
  res.render(`${res.locals.lang}/Parcours.njk`);
});


app.get('/Projects', async (req, res) => {
  const searchTerm = req.query.search;

  let projects;

  if (searchTerm) {
    projects = await prisma.project.findMany({
      where: {
        tags: {
          some: {
            tag: {
              name: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          }
        }
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
  } else {
    projects = await prisma.project.findMany({
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
  }

  res.render(`${res.locals.lang}/Projects.njk`, { projects });
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


app.get('/Tags/:tagId', async (req, res) => {
  const tagId = parseInt(req.params.tagId);
  const lang = res.locals.lang;

  try {
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) return res.status(404).send('Tag not found');

    const projects = await prisma.project.findMany({
      where: {
        tags: {
          some: {
            tagId: tagId,
          },
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    res.render(`${res.locals.lang}/Projects.njk`, { projects, tag });
  } catch (err) {
    console.error('Error filtering projects by tag:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.listen(port, () => {
  console.log("Listening on port: " + port);
});

app.get('/Projects/:id', async (req, res) => {
  const projectId = parseInt(req.params.id);
  const lang = res.locals.lang;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).send('Project not found');
    }

    res.render(`${res.locals.lang}/ProjectDetail.njk`, { project });
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/send-message', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    await prisma.message.create({
      data: {
        name,
        email,
        content: message,
      },
    });

    res.redirect('/Contacts?sent=true');
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement du message :', err);
    res.status(500).send('Erreur interne.');
  }
});


app.get('/Check_Message', async (req, res) => {
  const auth = req.query.auth;
  if (auth !== process.env.ADMIN_SECRET) {
    return res.status(403).send("Accès interdit");
  }

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
  });

  res.render(`FR/Check_Message.njk`, { messages });
});

