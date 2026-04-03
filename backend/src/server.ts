import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import http from 'http';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import adminRouter from './routes/admin';
import authRouter from './routes/auth';
import ordersRouter from './routes/orders';
import partnersRouter from './routes/partners';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('joinOrderRoom', (orderId: string) => {
    socket.join(`order:${orderId}`);
  });
});

app.set('io', io);
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/partners', partnersRouter);
app.use('/api/admin', adminRouter);

app.use((err: { status?: number; message?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status ?? 500;
  res.status(status).json({ error: err.message ?? "Internal Server Error" });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});


