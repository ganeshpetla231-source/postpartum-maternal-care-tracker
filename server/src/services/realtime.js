import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { joinEscalationRoom } from './apiService.js';

let io;

export function attachRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrls,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, env.jwtAccessSecret);
      const user = await User.findById(payload.sub).lean();
      if (!user || !user.isActive || user.isDeleted) return next(new Error('Invalid session'));
      socket.user = user;
      return next();
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('escalation:join', async ({ escalationId } = {}, acknowledge = () => {}) => {
      try {
        const data = await joinEscalationRoom(socket.user, escalationId);
        if (!data) {
          acknowledge({ success: false, message: 'You cannot join this conversation.' });
          return;
        }
        socket.join(`escalation:${escalationId}`);
        acknowledge({ success: true, data });
      } catch {
        acknowledge({ success: false, message: 'Conversation history could not be loaded.' });
      }
    });

    socket.on('typing', ({ escalationId, isTyping } = {}) => {
      if (!escalationId || !socket.rooms.has(`escalation:${escalationId}`)) return;
      socket.to(`escalation:${escalationId}`).emit('typing', {
        escalationId: String(escalationId),
        isTyping: Boolean(isTyping)
      });
    });
  });

  return io;
}

export function emitToRoom(room, event, payload) {
  io?.to(room).emit(event, payload);
}

export function emitToUser(userId, event, payload) {
  io?.sockets.sockets.forEach((socket) => {
    if (String(socket.user?._id) === String(userId)) socket.emit(event, payload);
  });
}
