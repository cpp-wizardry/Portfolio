const express = require('express');
const nunjucks = require('nunjucks');
const app = express();

const port = process.env.PORT || 3000;

app.use(express.static('public'));

nunjucks.configure('View', {
    autoescape: true,
    express: app,
    noCache: true 
});

app.get('/', (req, res) => {
    res.render('Index.njk');
});

app.get('/Projects', (req, res) => {
    res.render('Projects.njk');
});

app.get('/Portfolio', (req, res) => {
    res.render('Portfolio.njk');
});

app.listen(port, () => {
    console.log("Listening on port: " + port);
});
