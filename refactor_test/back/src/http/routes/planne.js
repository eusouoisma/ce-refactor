const express = require('express');
const { planneSyncService } = require('../../container');

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.get('/available-tours', wrap(async (req, res) => {
  res.json(await planneSyncService.getAvailableTours());
}));

// Receives events from Planne (public — no auth token required)
router.post('/webhook', wrap(async (req, res) => {
  const secret = process.env.PLANNE_WEBHOOK_SECRET;
  if (secret && req.headers['x-webhook-secret'] !== secret) {
    return res.status(401).json({ error: true, message: 'Unauthorized' });
  }
  const event = req.body;
  if (!event || !event.eventType || !event.metadata) {
    return res.status(400).json({ error: true, message: 'Invalid event payload' });
  }
  // Respond immediately — process async so Planne doesn't time out
  res.json({ received: true });
  planneSyncService.processWebhookEvent(event).catch(err =>
    console.error('[planne webhook] processing error:', err.message)
  );
}));

// Register our webhook URL with Planne (admin-only, called once)
router.post('/register-webhook', wrap(async (req, res) => {
  const { callbackUrl } = req.body;
  if (!callbackUrl) return res.status(400).json({ error: true, message: 'callbackUrl required' });
  const result = await planneSyncService.registerWebhook(callbackUrl);
  res.json({ error: false, webhook: result });
}));

// Webhook queue — pending events awaiting manual approval
router.get('/webhook-queue', wrap(async (req, res) => {
  res.json(await planneSyncService.getPendingQueue());
}));

router.post('/webhook-queue/:id/apply', async (req, res) => {
  try {
    await planneSyncService.applyQueueItem(Number(req.params.id));
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

router.post('/webhook-queue/:id/dismiss', async (req, res) => {
  try {
    await planneSyncService.dismissQueueItem(Number(req.params.id));
    res.json({ error: false });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

module.exports = router;
