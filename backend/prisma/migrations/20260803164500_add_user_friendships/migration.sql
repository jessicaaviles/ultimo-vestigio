CREATE TABLE "anonymous_user_friendships" (
  "id" TEXT NOT NULL,
  "requester_id" TEXT NOT NULL,
  "addressee_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "anonymous_user_friendships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "anonymous_user_friendships_requester_id_addressee_id_key"
  ON "anonymous_user_friendships"("requester_id", "addressee_id");

CREATE INDEX "anonymous_user_friendships_addressee_id_idx"
  ON "anonymous_user_friendships"("addressee_id");

ALTER TABLE "anonymous_user_friendships"
  ADD CONSTRAINT "anonymous_user_friendships_requester_id_fkey"
  FOREIGN KEY ("requester_id") REFERENCES "anonymous_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "anonymous_user_friendships"
  ADD CONSTRAINT "anonymous_user_friendships_addressee_id_fkey"
  FOREIGN KEY ("addressee_id") REFERENCES "anonymous_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
