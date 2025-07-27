const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('API is working!');
});

// Export the app as a Vercel handler
module.exports = app;
