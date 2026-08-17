-- Link Employee <-> User by id so de-baja always deactivates the right login user
ALTER TABLE "Employee" ADD COLUMN "userId" TEXT;

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_key" UNIQUE ("userId");
