const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const pool = require("../db");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// CREATE letterhead
router.post("/", async (req, res) => {
  const data = req.body;
  const query = `
    INSERT INTO letterheads (
      user_email,
      company_name_arabic,
      company_name_english,
      address_en,
      address_ar,
      cr_number_en,
      cr_number_ar,
      website,
      email,
      logo_url,
      primary_color,
      secondary_color,
      font_size,
      footer_font_size,
      title_align,
      description_align
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16
    ) RETURNING *;
  `;
  const values = [
    data.user_email,
    data.companyNameArabic,
    data.companyNameEnglish,
    data.address,
    data.addressAr,
    data.crNumber,
    data.crNumberArabic,
    data.website,
    data.email,
    data.logoUrl,
    data.primaryColor,
    data.secondaryColor,
    data.fontSize,
    data.footerFontSize,
    data.titleAlign,
    data.descriptionAlign,
  ];
  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error inserting letterhead:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET all letterheads by user email
router.get("/", async (req, res) => {
  const email = req.query.email;
  try {
    const result = await pool.query(
      "SELECT * FROM letterheads WHERE user_email = $1 ORDER BY created_at DESC",
      [email]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching letterheads:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET single letterhead by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM letterheads WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Letterhead not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching letterhead:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// UPDATE letterhead by user email
router.put("/email/:email", upload.single("logo"), async (req, res) => {
  const { email } = req.params;

  const {
    company_name_arabic,
    company_name_english,
    address_en,
    address_ar,
    cr_number_en,
    cr_number_ar,
    website,
    primary_color,
    secondary_color,
    font_size,
    footer_font_size,
    title_align,
    description_align,
  } = req.body;

  const logoUrl = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    : null;

  try {
    // First, try to update
    const result = await pool.query(
      `UPDATE letterheads SET
        company_name_arabic = $1,
        company_name_english = $2,
        address_en = $3,
        address_ar = $4,
        cr_number_en = $5,
        cr_number_ar = $6,
        website = $7,
        logo_url = COALESCE($8, logo_url),
        primary_color = $9,
        secondary_color = $10,
        font_size = $11,
        footer_font_size = $12,
        title_align = $13,
        description_align = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_email = $15
      RETURNING *`,
      [
        company_name_arabic,
        company_name_english,
        address_en,
        address_ar,
        cr_number_en,
        cr_number_ar,
        website,
        logoUrl,
        primary_color,
        secondary_color,
        font_size,
        footer_font_size,
        title_align,
        description_align,
        email,
      ]
    );

    if (result.rows.length > 0) {
      return res.json(result.rows[0]); // updated
    }

    // If update did not find a row, insert new
    const insertResult = await pool.query(
      `INSERT INTO letterheads (
        user_email,
        company_name_arabic,
        company_name_english,
        address_en,
        address_ar,
        cr_number_en,
        cr_number_ar,
        website,
        logo_url,
        primary_color,
        secondary_color,
        font_size,
        footer_font_size,
        title_align,
        description_align,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        email,
        company_name_arabic,
        company_name_english,
        address_en,
        address_ar,
        cr_number_en,
        cr_number_ar,
        website,
        logoUrl,
        primary_color,
        secondary_color,
        font_size,
        footer_font_size,
        title_align,
        description_align,
      ]
    );

    res.status(201).json(insertResult.rows[0]); // inserted
  } catch (err) {
    console.error("Error saving letterhead:", err);
    res.status(500).json({ error: "Database error" });
  }
});



// DELETE letterhead by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM letterheads WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting letterhead:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
