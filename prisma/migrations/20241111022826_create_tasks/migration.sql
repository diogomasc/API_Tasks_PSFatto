-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Task_displayOrder_key" ON "Task"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Task_description_key" ON "Task"("description");
