-- CreateTable
CREATE TABLE "Trade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "asset" TEXT NOT NULL DEFAULT 'US100',
    "bias" TEXT NOT NULL,
    "biasReason" TEXT,
    "entry" REAL,
    "sl" REAL,
    "tp" REAL,
    "time" TEXT,
    "rr" TEXT,
    "outcome" TEXT NOT NULL,
    "good" TEXT,
    "improve" TEXT,
    "checkCount" INTEGER NOT NULL DEFAULT 0,
    "checks" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
