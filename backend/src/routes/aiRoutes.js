

import express        from "express";
import multer         from "multer";
import { parseCV, reviewTutor } from "../controllers/aiControllers.js";
import { authMiddleware }       from "../middleware/adthMiddleware.js";
import { isAdmin }              from "../controllers/adminControllers.js";

const router = express.Router();

const largeJson = express.json({ limit: "20mb" });

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB raw file
  fileFilter: (_req, file, cb) => {
    const ok = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
      .includes(file.mimetype);
    cb(ok ? null : new Error("Chỉ hỗ trợ PDF, JPG, PNG, WEBP"), ok);
  },
});


router.post(
  "/parse-cv",
  authMiddleware,
  largeJson,                  
  (req, res, next) => {
    if (req.is("multipart/form-data")) {
      upload.single("cv")(req, res, next);
    } else {
      next();
    }
  },
  parseCV,
);

router.post("/review-tutor", authMiddleware, isAdmin, reviewTutor);

export default router;