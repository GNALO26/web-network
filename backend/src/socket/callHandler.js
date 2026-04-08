const CallRecord = require('../models/CallRecord');

module.exports = (io, socket) => {
  socket.on('call:join', ({ roomId, userId, isVideo }) => {
    socket.join(roomId);
    socket.to(roomId).emit('call:user-joined', { userId, isVideo });
  });

  socket.on('call:offer', ({ roomId, offer, userId }) => {
    socket.to(roomId).emit('call:offer', { offer, userId });
  });

  socket.on('call:answer', ({ roomId, answer, userId }) => {
    socket.to(roomId).emit('call:answer', { answer, userId });
  });

  socket.on('call:ice-candidate', ({ roomId, candidate, userId }) => {
    socket.to(roomId).emit('call:ice-candidate', { candidate, userId });
  });

  socket.on('call:leave', async ({ roomId, userId, duration, recordingUrl, recordingType }) => {
    socket.to(roomId).emit('call:user-left', { userId });
    socket.leave(roomId);
    // Sauvegarder l'enregistrement s'il existe
    if (recordingUrl && recordingType) {
      try {
        // Récupérer les participants de la room (à stocker dans une Map)
        const participants = [...io.sockets.adapter.rooms.get(roomId) || []];
        await CallRecord.create({
          participants,
          duration,
          recordingUrl,
          recordingType,
          initiatedBy: userId,
          endedAt: new Date()
        });
      } catch (err) {
        console.error(err);
      }
    }
  });
};