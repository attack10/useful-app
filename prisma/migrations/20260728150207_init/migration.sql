-- CreateTable
CREATE TABLE "shopping_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "required_count" INTEGER NOT NULL DEFAULT 1,
    "current_count" INTEGER NOT NULL DEFAULT 0,
    "amazon_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("id")
);
