import { Request } from "express";
import multer, { StorageEngine } from "multer";

const storage: StorageEngine = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ): void {
    cb(null, "./public/temp");
  },

  filename: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ): void {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 109);
    cb(null, file.originalname + "-" + uniqueSuffix);
  },
});

export const upload = multer({ storage });
