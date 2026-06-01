import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `trade-${req.params.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|webp|gif)$/;
    allowed.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only image files are allowed'));
  },
});

// GET /api/trades
router.get('/', async (_req: Request, res: Response) => {
  try {
    const trades = await prisma.trade.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(trades.map((t) => ({ ...t, checks: JSON.parse(t.checks) })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// POST /api/trades
router.post('/', async (req: Request, res: Response) => {
  const {
    date,
    asset,
    bias,
    biasReason,
    entry,
    sl,
    tp,
    time,
    rr,
    outcome,
    good,
    improve,
    checkCount,
    checks,
  } = req.body;

  if (!date || !bias || !outcome) {
    res.status(400).json({ error: 'date, bias, and outcome are required' });
    return;
  }

  try {
    const trade = await prisma.trade.create({
      data: {
        date,
        asset: asset || 'US100',
        bias,
        biasReason: biasReason || null,
        entry: entry != null && entry !== '' ? parseFloat(entry) : null,
        sl: sl != null && sl !== '' ? parseFloat(sl) : null,
        tp: tp != null && tp !== '' ? parseFloat(tp) : null,
        time: time || null,
        rr: rr || null,
        outcome,
        good: good || null,
        improve: improve || null,
        checkCount: checkCount ?? 0,
        checks: JSON.stringify(checks ?? []),
      },
    });
    res.status(201).json({ ...trade, checks: JSON.parse(trade.checks) });
  } catch {
    res.status(500).json({ error: 'Failed to create trade' });
  }
});

// PATCH /api/trades/:id
router.patch('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const {
    date,
    asset,
    bias,
    biasReason,
    entry,
    sl,
    tp,
    time,
    rr,
    outcome,
    good,
    improve,
    checkCount,
    checks,
  } = req.body;
  try {
    const trade = await prisma.trade.update({
      where: { id },
      data: {
        ...(date !== undefined && { date }),
        ...(asset !== undefined && { asset }),
        ...(bias !== undefined && { bias }),
        ...(biasReason !== undefined && { biasReason: biasReason || null }),
        ...(entry !== undefined && {
          entry: entry != null && entry !== '' ? parseFloat(entry) : null,
        }),
        ...(sl !== undefined && {
          sl: sl != null && sl !== '' ? parseFloat(sl) : null,
        }),
        ...(tp !== undefined && {
          tp: tp != null && tp !== '' ? parseFloat(tp) : null,
        }),
        ...(time !== undefined && { time: time || null }),
        ...(rr !== undefined && { rr: rr || null }),
        ...(outcome !== undefined && { outcome }),
        ...(good !== undefined && { good: good || null }),
        ...(improve !== undefined && { improve: improve || null }),
        ...(checkCount !== undefined && { checkCount }),
        ...(checks !== undefined && { checks: JSON.stringify(checks) }),
      },
    });
    res.json({ ...trade, checks: JSON.parse(trade.checks) });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      res.status(404).json({ error: 'Trade not found' });
    } else {
      res.status(500).json({ error: 'Failed to update trade' });
    }
  }
});

// DELETE /api/trades/:id
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  try {
    const existing = await prisma.trade.findUnique({ where: { id } });
    if (existing?.imageUrl) {
      const imgPath = path.join(uploadsDir, path.basename(existing.imageUrl));
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await prisma.trade.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      res.status(404).json({ error: 'Trade not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete trade' });
    }
  }
});

// POST /api/trades/:id/image
router.post(
  '/:id/image',
  upload.single('image'),
  async (req: Request<{ id: string }>, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    try {
      // Remove old image file if it exists
      const existing = await prisma.trade.findUnique({ where: { id } });
      if (existing?.imageUrl) {
        const oldPath = path.join(uploadsDir, path.basename(existing.imageUrl));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      const trade = await prisma.trade.update({
        where: { id },
        data: { imageUrl },
      });
      res.json({ ...trade, checks: JSON.parse(trade.checks) });
    } catch {
      res.status(404).json({ error: 'Trade not found' });
    }
  },
);

export default router;
