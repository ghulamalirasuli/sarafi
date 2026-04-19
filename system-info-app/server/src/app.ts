import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { setRoutes } from './routes/systemRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
setRoutes(app);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});