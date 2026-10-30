-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('READER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'READER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "contentJson" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoreEntry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "unlockFlag" TEXT NOT NULL,
    "coverImage" TEXT,
    "contentJson" JSONB NOT NULL,

    CONSTRAINT "LoreEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flagsJson" JSONB NOT NULL,
    "chapterSlug" TEXT,
    "ending" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoiceStat" (
    "id" TEXT NOT NULL,
    "choiceId" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChoiceStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoiceVote" (
    "requestId" TEXT NOT NULL,
    "choiceId" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChoiceVote_pkey" PRIMARY KEY ("requestId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_slug_key" ON "Chapter"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LoreEntry_slug_key" ON "LoreEntry"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StoryProgress_userId_key" ON "StoryProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChoiceStat_choiceId_optionKey_key" ON "ChoiceStat"("choiceId", "optionKey");

-- AddForeignKey
ALTER TABLE "StoryProgress" ADD CONSTRAINT "StoryProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
