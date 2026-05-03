import express from "express";
import { register, login, logout } from "../controllers/authControllers.js";
import { registerSchema, loginSchema } from "../validators/authValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

router.post("/logout", logout);

export default router;