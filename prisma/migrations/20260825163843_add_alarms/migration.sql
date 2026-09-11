-- CreateTable
CREATE TABLE "Alarm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "daysOfWeek" TEXT NOT NULL,
    "sound" TEXT NOT NULL DEFAULT 'padrao',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alarm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Alarm_userId_idx" ON "Alarm"("userId");
