-- CreateTable
CREATE TABLE "Attempts" (
    "attempt" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "helixId" TEXT NOT NULL,
    "difference" REAL NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "value" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Goaters" (
    "goatCount" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "helixId" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "totalAttempts" INTEGER NOT NULL
);
