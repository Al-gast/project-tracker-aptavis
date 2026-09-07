import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js'

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
   try {
      await prisma.project.count();
      res.status(200).json({ 
        status: 'ok', 
        message: 'Database connection is healthy' 
    });
   } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed' 
    });
   }
})

app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes)

export default app;