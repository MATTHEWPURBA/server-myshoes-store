-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingFee" DOUBLE PRECISION,
ADD COLUMN     "shippingMethod" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';
