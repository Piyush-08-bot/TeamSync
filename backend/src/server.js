import express from 'express';
import { ENV } from './config/env.js'; // importing local files must add extension(.js) in the end
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
    res.send("Welcome to TeamSync")
})

app.listen(ENV.PORT, () => {
    console.log("Server started on port:", ENV.PORT)
    connectDB()
})
