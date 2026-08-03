-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_categoryId_fkey";

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
