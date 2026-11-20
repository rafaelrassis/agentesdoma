-- CreateTable
CREATE TABLE "ShopeeLogin" (
    "target" TEXT NOT NULL,
    "loggedIn" BOOLEAN,
    "detail" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopeeLogin_pkey" PRIMARY KEY ("target")
);
