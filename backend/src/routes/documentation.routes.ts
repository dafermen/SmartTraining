import { Router } from "express";
import {
  getDocumentation,
  listDocumentation,
} from "../controllers/documentation.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const documentationRouter = Router();

documentationRouter.use(authenticate);
documentationRouter.get("/", listDocumentation);
documentationRouter.get("/:documentId", getDocumentation);
