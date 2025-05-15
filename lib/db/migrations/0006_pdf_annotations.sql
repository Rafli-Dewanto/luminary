ALTER TABLE "Message_v2"
ADD COLUMN IF NOT EXISTS "pdfAnnotations" json DEFAULT '[]'::json;