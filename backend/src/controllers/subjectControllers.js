import { prisma } from "../config/db.js";

export const getSubjects = async (_req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: { subjects },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
