-- CreateTable
CREATE TABLE "seller_categories" (
    "seller_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "seller_categories_pkey" PRIMARY KEY ("seller_id","category_id")
);

-- AddForeignKey
ALTER TABLE "seller_categories" ADD CONSTRAINT "seller_categories_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_categories" ADD CONSTRAINT "seller_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
