export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const firstError = result.error?.issues?.[0]?.message || "Dữ liệu không hợp lệ";
    return res.status(400).json({ message: firstError });
  }

  req.body = result.data;
  next();
};