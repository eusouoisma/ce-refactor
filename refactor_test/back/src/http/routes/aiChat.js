const express = require('express');
const AiChatRepository = require('../../infrastructure/repositories/AiChatRepository');
const AiChatService = require('../../application/AiChatService');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

const repo = new AiChatRepository();
const service = new AiChatService(repo);

router.post('/message', wrap(async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: true, message: 'ANTHROPIC_API_KEY não configurada' });
  }
  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: true, message: 'sessionId e message são obrigatórios' });
  }
  const result = await service.chat(
    req.user.userId,
    req.user.name,
    sessionId,
    message
  );
  res.json(result);
}));

router.get('/sessions', wrap(async (req, res) => {
  const sessions = await service.getSessions(req.user.userId);
  res.json(sessions);
}));

router.get('/sessions/:sessionId', wrap(async (req, res) => {
  const messages = await service.getSessionMessages(req.params.sessionId);
  res.json(messages);
}));

module.exports = router;
