const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { sequelize } = require('./config/database');
const linkRoutes = require('./routes/linkRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

global.serverStartTime = Date.now();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

 
app.use('/', linkRoutes);


app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});


app.listen(PORT, async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log("Database connected successfully.");
    } catch (error) {
        console.log("Error", error);
    }
})