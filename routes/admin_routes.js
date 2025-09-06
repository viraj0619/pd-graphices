const express = require("express");
const exe = require("./../connection");
const router = express.Router();
// const upload = require("../utils/multer");
const bcrypt = require("bcrypt");
const fs = require('fs');
const path = require("path");
const busboy = require("connect-busboy");

// Add this middleware
router.use(busboy({
  highWaterMark: 2 * 1024 * 1024, // 2MB buffer
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB max
  }
}));


// Middleware for checking admin login
const adminAuth = (req, res, next) => {
  // Check if admin is logged in
  if (!req.session?.admin_id) {
    // Admin not logged in
    // Optionally store the page they wanted to access
    req.session.redirectTo = req.originalUrl;

    // Redirect to admin login page
    return res.redirect("/admin/adminLogin");
  }

  // Admin is logged in, proceed
  next();
};

// ✅ Admin home
router.get("/", adminAuth, async function (req, res) {

const adminDpLogo = await exe(
  // console.log(req.session.admin_id)

  `SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,
  [1] );
  const websitteViews=await exe("SELECT website_views FROM admin_details WHERE admin_id=?",[1])
  // const Allrders=await exe("SELECT COUNT(*) AS total FROM user_orders")

const todayDate = new Date().toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
}); // "28 August 2025"

const TodayOrders = await exe(
  "SELECT COUNT(*) AS today_orders FROM user_orders WHERE TRIM(order_date) = ?",
  [todayDate]
);
const AllOrders=await exe("SELECT COUNT(*) AS all_orders FROM user_orders");

const TodayIncome = await exe(
  "SELECT SUM(total_price) AS today_income FROM user_orders WHERE TRIM(order_date) = ?",[todayDate]
);
const allIncome = await exe(
  "SELECT SUM(total_price) AS all_income FROM user_orders"
);

const userAccounts=await exe("SELECT COUNT(*) AS user_accounts FROM users_register");

const activeDesigns=await exe("SELECT COUNT(*) AS active_designs FROM design_files WHERE status='active'");
const inActive=await exe("SELECT COUNT(*) AS active_designs FROM design_files WHERE status='inactive'");
const allDesigns=await exe("SELECT COUNT(*) AS all_designs FROM design_files");
const inStock=await exe("SELECT COUNT(*) AS in_stock FROM design_files WHERE stock='instock'");
const outStock=await exe("SELECT COUNT(*) AS out_stock FROM design_files WHERE stock='outstock'");

const totalTransac=await exe("SELECT COUNT(*) AS total_tran FROM transaction")
const filedTransac=await exe("SELECT COUNT(*) AS failed_tra FROM transaction WHERE payment_status='pending'");
const successTrans=await exe("SELECT COUNT(*) AS success_tra FROM transaction WHERE payment_status='success'");

const todayContactRes=await exe("SELECT COUNT(*) AS today_responce FROM user_contact WHERE TRIM(date) = ?",
  [todayDate])
const allContact=await exe("SELECT COUNT(*) AS all_responce FROM user_contact")

// console.log(successTrans);

  const obj={
       adminDpLogo:adminDpLogo,
       websitteViews:websitteViews,
       TodayOrders:TodayOrders,
       AllOrders:AllOrders,
       TodayIncome:TodayIncome,
       allIncome:allIncome,
       userAccounts:userAccounts,
       activeDesigns:activeDesigns,
       inActive:inActive,
       allDesigns:allDesigns,
       inStock:inStock,
       outStock:outStock,
       totalTransac:totalTransac,
       filedTransac:filedTransac,
       successTrans:successTrans,
       todayContactRes:todayContactRes,
       allContact:allContact
  }
  res.render("admin/home.ejs",obj);
});
router.get("/adminLogin",(req, res) => {
  if (req.session.admin_id) {
    // already logged in → redirect directly
    return res.redirect("/admin/");
  }
  res.render("admin/adminLogin.ejs", { message: null, type: null });
});

// ✅ Process Login
router.post("/processAdmin_login", async (req, res) => {
  try {
    const { email_or_phone, admin_password } = req.body;

    const query = `
      SELECT * FROM admin_details 
      WHERE (admin_email = ? OR admin_mobile = ?) AND admin_password = ?
    `;
    const values = [email_or_phone, email_or_phone, admin_password];
    const data = await exe(query, values);

    if (data.length > 0) {
      // Save session
      req.session.admin_id = data[0].admin_id;

      const redirectTo = req.session.redirectTo || "/admin/";
      delete req.session.redirectTo;

      // ✅ Render login page with success message and redirect target
      return res.render("admin/adminLogin.ejs", {
        message: "✅ Login Successful! Welcome to Dashboard.",
        type: "success",
        redirectTo,   // pass redirect URL
      });
    } else {
      return res.render("admin/adminLogin.ejs", {
        message: "❌ Invalid Email or Password!",
        type: "danger",
        redirectTo: null,
      });
    }
  } catch (err) {
    console.error("Login Error:", err);
    return res.render("admin/adminLogin.ejs", {
      message: "⚠️ Something went wrong. Please try again!",
      type: "danger",
      redirectTo: null,
    });
  }
});


// ✅ Secure Admin Logout
router.get("/logout", adminAuth,(req, res) => {
  try {
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("❌ Logout failed. Try again.");
      }

      // Clear session cookie
      res.clearCookie("connect.sid", {
        path: "/", 
        httpOnly: true,
        secure: true,   // set true if using HTTPS
        sameSite: "strict"
      });

      // Prevent caching of protected pages
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      // Redirect to login page
      return res.redirect("/admin/adminLogin");
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).send("❌ Something went wrong while logging out.");
  }
});


// ✅ Admin profile page
router.get("/admin_profile", adminAuth,async (req, res) => {
  const profile_data = await exe(`SELECT * FROM admin_details WHERE admin_id = ?`,[1]);
  const adminDpLogo = await exe(`SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,[1] );

  const dataObj = { "profile_data": profile_data[0], adminDpLogo:adminDpLogo};
  res.render("admin/admin_profile.ejs", dataObj);
});

router.get("/edit_adminProfile",adminAuth,async (req,res)=>{
  const profile_data = await exe(`SELECT * FROM admin_details WHERE admin_id = ?`,[1]);
  const adminDpLogo = await exe(`SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,[1] );

  const dataObj = { "profile_data": profile_data[0],adminDpLogo:adminDpLogo};
  res.render("admin/edit_adminProfile.ejs",dataObj);
});

 router.post("/update_adminProfile",adminAuth, async (req,res)=>{
  const data=req.body;
 
  const updateProfile=await exe(`UPDATE admin_details SET admin_name= ?, admin_bio = ?, admin_email = ?, admin_mobile= ? ,admin_address= ?`,[data.admin_name,data.admin_bio,data.admin_email,data.admin_mobile,data.admin_address]);
  res.redirect("/admin/admin_profile")
})

router.get("/change_admin_pass",adminAuth, async (req, res) => {
  const adminDpLogo = await exe(`SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,[1] );
  
  res.render("admin/change_admin_pass.ejs",{adminDpLogo});
});


router.post("/update_password",adminAuth, async (req, res) => {
  const { admin_password, admin_newPassword } = req.body;

  try {
    const data = await exe("SELECT admin_password FROM admin_details WHERE admin_id = ?", [1]);

    if (data.length === 0) {
      return res.json({ success: false, message: "Admin not found." });
    }

    const storedPassword = data[0].admin_password;

    // ✅ Compare plain passwords
    if (admin_password !== storedPassword) {
      return res.json({ success: false, message: "Old password does not match." });
    }

    // ✅ Update with new password
    await exe("UPDATE admin_details SET admin_password = ? WHERE admin_id = ?", [admin_newPassword, 1]);

    return res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Error updating password." });
  }
});


// ✅ Company info page
router.get("/company_info",adminAuth, async (req, res) => {
  const company_info = await exe(`SELECT * FROM admin_details WHERE admin_id = ?`,[1]);
  const adminDpLogo = await exe(`SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,[1] );

  const Dataobj = { company_info: company_info[0],adminDpLogo:adminDpLogo };
  res.render("admin/company_info.ejs", Dataobj);
});

// ✅ Image upload + form update
router.post("/update_details",adminAuth, async (req, res) => {
  const data = req.body;

  // Handle image upload only if present
  if (req.files && req.files.admin_logo) {
    const uploadDir = path.join(__dirname, "../public/admin/uploads");

    // Step 1: Get current image from DB
    const oldData = await exe(`SELECT admin_logo FROM admin_details WHERE admin_id = ?`, [1]);
    const oldImage = oldData[0]?.admin_logo;

    // Step 2: Delete old image from folder if exists
    if (oldImage) {
      const oldImagePath = path.join(uploadDir, oldImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Step 3: Upload new image
    const adminLogo = `${Date.now()}.png`;
    const uploadPath = path.join(uploadDir, adminLogo);
    await req.files.admin_logo.mv(uploadPath);

    // Step 4: Update new logo in DB
    const query = `UPDATE admin_details SET admin_logo = ? WHERE admin_id = ?`;
    const values = [adminLogo, 1];
    await exe(query, values);
  }

  // Update the rest of the details
  const query = `
    UPDATE admin_details
    SET
      admin_email = ?,
      admin_mobile = ?,
      admin_insta = ?,
      admin_linkedin = ?,
      admin_facebook = ?,
      admin_youtube = ?,
      admin_address = ?,
      company_name = ?
    WHERE admin_id = ?
  `;

  const values = [
    data.admin_email,
    data.admin_mobile,
    data.admin_insta,
    data.admin_linkedin,
    data.admin_facebook,
    data.admin_youtube,
    data.admin_address,
    data.company_name,
    1
  ];

  await exe(query, values);

  res.redirect("/admin/company_info");
});


// ✅ Route: Upload and Update Admin DP
router.post("/update_admin_dp",adminAuth, async (req, res) => {
  try {
    if (!req.files || !req.files.admin_dp) {
      return res.json({ success: false, message: "No file uploaded." });
    }

    const file = req.files.admin_dp;
    const ext = path.extname(file.name);
    const filename = Date.now() + ext;

    // 📁 Upload path defined inside route
    const uploadDir = path.join(__dirname, "../public/admin/uploads");
    const savePath = path.join(uploadDir, filename);

    // Move new image to folder
    await file.mv(savePath);

    // Get old image from DB
    const [old] = await exe("SELECT admin_dp FROM admin_details WHERE admin_id = ?", [1]);

    // Delete old image from folder
    if (old && old.admin_dp) {
      const oldPath = path.join(uploadDir, old.admin_dp);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Update new image in DB
    await exe("UPDATE admin_details SET admin_dp = ? WHERE admin_id = ?", [filename, 1]);

    return res.json({ success: true, filename });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Server error" });
  }
});

// ✅ Route: Delete Admin DP
router.post("/delete_admin_dp",adminAuth, async (req, res) => {
  try {
    // 📁 Upload path defined inside route
    const uploadDir = path.join(__dirname, "../public/admin/uploads");

    const [admin] = await exe("SELECT admin_dp FROM admin_details WHERE admin_id = ?", [1]);

    if (admin && admin.admin_dp) {
      const filePath = path.join(uploadDir, admin.admin_dp);

      // Delete image file if exists
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      // Set image NULL in DB
      await exe("UPDATE admin_details SET admin_dp = NULL WHERE admin_id = ?", [1]);

      return res.json({ success: true });
    } else {
      return res.json({ success: false, message: "No image found to delete." });
    }
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Error deleting image" });
  }
});

// ✅ Other admin routes

router.get("/design_file",adminAuth, async (req, res) => {
  const categoryName=await exe(`SELECT * FROM categories  ORDER BY category_id DESC`)
  const adminDpLogo = await exe(`SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,[1] );

  const obj={"categoryName":categoryName,adminDpLogo:adminDpLogo}
  res.render("admin/design_file.ejs",obj);
});

router.post("/add_file", adminAuth,async (req, res) => {
  const data = req.body;

  let fileImgName = null;
  let uploadPath = null;

  if (req.files && req.files.file_img) {
    // Generate a unique image filename

    fileImgName = `${Date.now()}.png`;
    uploadPath = `public/admin/uploads/${fileImgName}`;

    // Move uploaded image to destination
    await req.files.file_img.mv(uploadPath);
  }

  const status = "inactive";
  const stock="outstock";
  const file_view = 0;
  const file_perchesed = 0;

  const todayDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const query = `
    INSERT INTO design_files (
      file_img,
      design_name,
      file_price,
      file_dis,
      final_price,
      main_file,
      file_des,
      status,
      date,
      file_view,
      file_perchesed,
      stock,
      categories
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    fileImgName, // only the filename saved
    data.design_name,
    data.file_price,
    data.file_dis,
    data.final_price,
    null, // main_file is null
    data.file_des,
    status,
    todayDate,
    file_view,
    file_perchesed,
    stock,
    data.category_name
  ];

  const card_details = await exe(query, values);
  res.redirect("/admin/file_list");
});


// Show the Upload Page
router.get("/add_design_zipfile/:id",adminAuth,async (req, res) => {
  const fileId = req.params.id;
  const adminDpLogo = await exe(`SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,[1] );

  res.render("admin/add_design_zipfile.ejs", { fileId, message: null ,adminDpLogo});
});

// Handle Upload POST
router.post("/uploadzip/:id",adminAuth, async (req, res) => {
  const fileId = req.params.id;

  try {
    // Validate uploaded file
    if (!req.files || !req.files.main_file) {
      return res.status(400).send("❌ No file uploaded.");
    }

    const file = req.files.main_file;

    // Validate file type (only ZIP)
    if (file.mimetype !== "application/zip" && !file.name.endsWith(".zip")) {
      return res.status(400).send("❌ Only .zip files are allowed.");
    }

    const fileName = `${Date.now()+".zip"}`;
    const stockStatus = "instock";

    const uploadDir = path.join(__dirname, "../public/designZipfiles");
    const uploadPath = path.join(uploadDir, fileName);

    // Ensure folder exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Move uploaded file to the folder
    await file.mv(uploadPath);

    // Update file name and stock status in DB
    const sql = `UPDATE design_files SET main_file = ?, stock = ? WHERE file_id = ?`;
    await exe(sql, [fileName, stockStatus, fileId]);

    // Redirect after successful upload
    res.redirect("/admin/file_list");

  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).send("❌ Server error while uploading file.");
  }
});

// router.post("/add_file", (req, res) => {
//     // Check if busboy is available. It's good practice.
//     if (!req.busboy) return res.status(400).send("❌ Busboy not initialized.");

//     const uploadDir = path.join(__dirname, "public/designZipfiles");
//     const imgDir = path.join(__dirname, "public/admin/uploads");

//     // Ensure upload directories exist.
//     if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
//     if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

//     let formData = {};
//     let main_file_path = null;
//     let image_file_path = null;
//     let filesDone = 0;
//     const expectedFiles = 2; // We expect exactly two files: file_img and main_file.

//     // A function to check if everything is ready for database insertion.
//     const tryToInsert = () => {
//         // Only proceed if all files have been processed and paths are set.
//         if (filesDone === expectedFiles && main_file_path && image_file_path) {
//             insertDataIntoDatabase();
//         }
//     };

//     // Handle form fields.
//     req.busboy.on("field", (fieldname, val) => {
//         formData[fieldname] = val;
//     });

//     // Handle file uploads.
//     req.busboy.on("file", (fieldname, file, { filename }) => {
//         const ext = path.extname(filename || "").toLowerCase();

//         if (fieldname === "main_file") {
//             if (ext !== ".zip") {
//                 file.resume(); // Drain the file to prevent busboy from hanging.
//                 return res.status(400).send("❌ Only .zip files allowed for the main file.");
//             }

//             const zipName = Date.now() + ".zip";
//             const savePath = path.join(uploadDir, zipName);
//             main_file_path = `public/designZipfiles/${zipName}`;

//             const writeStream = fs.createWriteStream(savePath);
//             file.pipe(writeStream);
//             writeStream.on("finish", () => {
//                 filesDone++;
//                 tryToInsert();
//             });

//         } else if (fieldname === "file_img") {
//             const imgName = Date.now() + ".png"; // Assuming all images are saved as PNGs.
//             const savePath = path.join(imgDir, imgName);
//             image_file_path = `public/admin/uploads/${imgName}`;

//             const writeStream = fs.createWriteStream(savePath);
//             file.pipe(writeStream);
//             writeStream.on("finish", () => {
//                 filesDone++;
//                 tryToInsert();
//             });
//         } else {
//             file.resume(); // Drain any unexpected files.
//         }
//     });

//     // Handle the end of the form stream.
//     req.busboy.on("finish", () => {
//         // This event might fire before the file streams are done, so we rely on tryToInsert.
//         tryToInsert();
//     });

//     // Main function to insert data into the database.
//     const insertDataIntoDatabase = () => {
//         try {
//             const {
//                 design_name,
//                 file_price,
//                 file_dis,
//                 final_price,
//                 file_des,
//             } = formData;

//             const status = "inactive";
//             const file_view = 0;
//             const file_perchesed = 0;
//             const todayDate = new Date().toLocaleDateString("en-GB", {
//                 day: "2-digit",
//                 month: "long",
//                 year: "numeric",
//             });

//             const query = `
//                 INSERT INTO design_files (
//                     file_img, design_name, file_price, file_dis, final_price,
//                     main_file, file_des, status, date, file_view, file_perchesed
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `;

//             const values = [
//                 image_file_path,
//                 design_name,
//                 file_price,
//                 file_dis,
//                 final_price,
//                 main_file_path,
//                 file_des,
//                 status,
//                 todayDate,
//                 file_view,
//                 file_perchesed,
//             ];

//             // Assuming `exe` is your database execution function.
//             exe(query, values)
//                 .then(() => res.redirect("/admin/file_list"))
//                 .catch(err => {
//                     console.error("❌ DB error:", err);
//                     // Clean up uploaded files on database error to avoid orphaned files.
//                     if (main_file_path) fs.unlinkSync(path.join(uploadDir, path.basename(main_file_path)));
//                     if (image_file_path) fs.unlinkSync(path.join(imgDir, path.basename(image_file_path)));
//                     res.status(500).send("❌ DB insert failed.");
//                 });
//         } catch (err) {
//             console.error("❌ Insertion error:", err);
//             // Clean up files on any other insertion error.
//             if (main_file_path) fs.unlinkSync(path.join(uploadDir, path.basename(main_file_path)));
//             if (image_file_path) fs.unlinkSync(path.join(imgDir, path.basename(image_file_path)));
//             res.status(500).send("❌ Failed.");
//         }
//     };

//     // Pipe the request into busboy to start processing.
//     req.pipe(req.busboy);
// });


router.get("/file_list",adminAuth, async (req, res) => {
  try {
    const perPage = 20; // ✅ how many rows per page
    const currentPage = parseInt(req.query.page) || 1;

    const totalCountResult = await exe(`SELECT COUNT(*) as count FROM design_files`);
    const totalFiles = totalCountResult[0].count;
    const totalPages = Math.ceil(totalFiles / perPage);

    const offset = (currentPage - 1) * perPage;
    const filesData = await exe(`SELECT * FROM design_files ORDER BY file_id DESC LIMIT ? OFFSET ?`, [perPage, offset]);
  const adminDpLogo = await exe(`SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,[1] );

    const obj = {
      filesData: filesData,
      totalPages: totalPages,
      currentPage: currentPage,
      adminDpLogo:adminDpLogo
    };

    res.render("admin/file_list.ejs", obj);
  } catch (err) {
    console.error("Error in /file_list:", err);
    res.status(500).send("Server Error");
  }
});

//  MySQL connection assumed as 'exe' from your setup
router.post("/design_update_status",adminAuth, async (req, res) => {
    const { id, status } = req.body;

    try {
        await exe("UPDATE design_files SET status = ? WHERE file_id = ?", [status, id]);
        res.json({ success: true, message: "Status updated successfully." });
    } catch (err) {
        console.error("Status Update Error:", err);
        res.json({ success: false, message: "Failed to update status." });
    }
});

router.get("/edit_design/:id",adminAuth,async(req,res)=>{
 const file_id=req.params.id;
const file_data = await exe("SELECT * FROM design_files WHERE file_id = ?", [file_id]);
  const categoryName=await exe(`SELECT * FROM categories  ORDER BY category_id DESC`)
  const adminDpLogo = await exe(`SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,[1] );

const obj={"file_data":file_data[0],"categoryName":categoryName,adminDpLogo:adminDpLogo}
//  console.log(file_data)
  res.render("admin/edit_design.ejs",obj);
});


  router.post("/update_file/:id",adminAuth, async (req, res) => {

  try {
       const file_id = req.params.id;
       const data = req.body;

    if (req.files && req.files.file_img) {
      // 1. Get old image name from DB
      const [old] = await exe("SELECT file_img FROM design_files WHERE file_id = ?", [file_id]);

      // 2. Delete old image from folder if exists
      if (old && old.file_img) {
        const oldPath = path.join(__dirname, "../public/admin/uploads", old.file_img);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      // 3. Save new image
      const fileImgName = `${Date.now()}.png`;
      const uploadPath = path.join(__dirname, "../public/admin/uploads", fileImgName);

      await req.files.file_img.mv(uploadPath);

      // 4. Update image name in DB
      const updateImgQuery = `UPDATE design_files SET file_img = ? WHERE file_id = ?`;
      await exe(updateImgQuery, [fileImgName, file_id]);
    }

    // 5. Update remaining fields
    const updateQuery = `
      UPDATE design_files
      SET
        design_name = ?,
        file_price = ?,
        file_dis = ?,
        final_price = ?,
        file_des = ?,
        file_view = ?,
        file_perchesed = ?,
        categories = ?
      WHERE file_id = ?
    `;

    const values = [
      data.design_name,
      data.file_price,
      data.file_dis,
      data.final_price,
      data.file_des,
      data.file_view,
      data.file_perchesed,
      data.category_name,
      file_id
    ];

    await exe(updateQuery, values);

    res.redirect("/admin/file_list");
  } catch (err) {
    console.error("Error updating file:", err);
    res.status(500).send("Server Error");
  }
});

router.get("/delete_design/:id",adminAuth, async (req, res) => {
  const fileId = req.params.id;

  try {
    // 1. Get file info from DB (main_file and file_img)
    const [data] = await exe(
      "SELECT main_file, file_img FROM design_files WHERE file_id = ?",
      [fileId]
    );

    if (!data) return res.status(404).send("❌ File not found in database");

    // 2. Delete ZIP file (main_file)
    if (data.main_file) {
      const zipPath = path.join(__dirname, "../public/designZipfiles", data.main_file);
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    }

    // 3. Delete image file (file_img)
    if (data.file_img) {
      const imgPath = path.join(__dirname, "../public/admin/uploads", data.file_img);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    // 4. Delete DB record
    await exe("DELETE FROM design_files WHERE file_id = ?", [fileId]);

    // 5. Redirect
    res.redirect("/admin/file_list");
  } catch (err) {
    console.error("❌ Error deleting file:", err);
    res.status(500).send("Server error while deleting file.");
  }
});

// ✅ Enquiry List with Pagination
router.get("/enquiry_list",adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;   // current page
    const limit = 9;                              // 9 responses per page
    const offset = (page - 1) * limit;

    // Total records
    const countResult = await exe("SELECT COUNT(*) AS total FROM user_contact");
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / limit);

    // Get paginated data
    const userData = await exe(
      "SELECT * FROM user_contact ORDER BY user_id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
     const adminDpLogo = await exe(`SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,[1]);
    res.render("admin/enquiry_list.ejs", {
      userData,
      currentPage: page,
      totalPages,
      adminDpLogo
    });

  } catch (error) {
    console.error("❌ Pagination Error:", error);
    res.status(500).send("Something went wrong!");
  }
});


router.get("/delete_response/:id",adminAuth, async (req,res)=>{
  const userId=req.params.id;
  const deleteResponse=await exe(`delete from user_contact where user_id= ?`,[userId])
  res.redirect("/admin/enquiry_list");
});

// ✅ User List with Pagination
router.get("/user_list",adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;   // Current page
    const limit = 20;                             
    const offset = (page - 1) * limit;

    // Count total users
    const countResult = await exe("SELECT COUNT(*) AS total FROM users_register");
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / limit);

    // Fetch paginated users
    const userData = await exe(
      "SELECT * FROM users_register ORDER BY user_id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
     const adminDpLogo = await exe(`SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,[1]);

    res.render("admin/user_list.ejs", {
      userData,
      currentPage: page,
      totalPages,
      adminDpLogo
    });

  } catch (error) {
    console.error("❌ Pagination Error:", error);
    res.status(500).send("Something went wrong!");
  }
});


router.get("/delete_account/:id",adminAuth,async(req,res)=>{
     const register_id=req.params.id;
     const deleteAccount=await exe(`DELETE  FROM users_register WHERE user_id=?`,[register_id]);
     res.redirect("/admin/user_list");
})

router.get("/add_category",adminAuth,async (req,res)=>{
    const categoryList = await exe("SELECT * FROM categories ORDER BY category_id DESC");
     const adminDpLogo = await exe(`SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,[1]);
  res.render("admin/add_category.ejs",{ categoryList,adminDpLogo });
});
router.post("/add_newCategory",adminAuth, async (req, res) => {
  try {
    const data = req.body;

    const addCategory = await exe(
      `INSERT INTO categories (category_name) VALUES (?)`,
      [data.category_name]
    );
  res.redirect("/admin/add_category")
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ success: false, message: "Failed to add category." });
  }
});

// DELETE Category by ID
router.get("/delete_category/:id",adminAuth, async (req, res) => {
  try {
    const id = req.params.id;

    // Use correct SQL syntax: DELETE FROM
    const deleteCategory = await exe(`DELETE FROM categories WHERE category_id = ?`, [id]);

    res.redirect("/admin/add_category");
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/hero_section",adminAuth,async (req,res)=>{
  const heroData=await exe(`select * from hero_section where hero_id=?`,[1])
     const adminDpLogo = await exe(`SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,[1]);

  res.render("admin/hero_section.ejs",{heroData,adminDpLogo});
});

// ✅ Update Hero Section
router.post("/update_hero",adminAuth, async (req, res) => {
  try {
    // Destructure request body
    const {
      name1,
      subname1,
      buttonname1,
      buttonpath1,
      name2,
      subname2,
      buttonname2,
      buttonpath2,
      name3,
      subname3,
      buttonname3,
      buttonpath3,
    } = req.body;

    // Validation (optional but recommended)
    if (
      !name1 || !subname1 || !buttonname1 || !buttonpath1 ||
      !name2 || !subname2 || !buttonname2 || !buttonpath2 ||
      !name3 || !subname3 || !buttonname3 || !buttonpath3
    ) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Update query (fixed hero_id = 1, or replace with req.body.hero_id if dynamic)
    const updateQuery = `
      UPDATE hero_section 
      SET name1=?, subname1=?, buttonname1=?, buttonpath1=?, 
          name2=?, subname2=?, buttonname2=?, buttonpath2=?, 
          name3=?, subname3=?, buttonname3=?, buttonpath3=? 
      WHERE hero_id=?`;

    const updateValues = [
      name1, subname1, buttonname1, buttonpath1,
      name2, subname2, buttonname2, buttonpath2,
      name3, subname3, buttonname3, buttonpath3,
      1 // 👈 Static ID, change to req.body.hero_id if you want dynamic
    ];

    await exe(updateQuery, updateValues);

    // Success redirect
    res.redirect("/admin/hero_section");

  } catch (error) {
    console.error("❌ Error updating hero section:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
});

router.get("/all_orders", adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // default page = 1
        const limit = 50;
        const offset = (page - 1) * limit;

        // Admin info
        const adminDpLogo = await exe(
            `SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,
            [1]
        );

        // Get paginated orders
        const orderData = await exe(
            `SELECT * FROM user_orders ORDER BY order_id DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        // Count total orders for pagination
        const totalOrdersResult = await exe(`SELECT COUNT(*) AS total FROM user_orders`);
        const totalOrders = totalOrdersResult[0].total;
        const totalPages = Math.ceil(totalOrders / limit);

        const obj = {
            adminDpLogo,
            orderData,
            currentPage: page,
            totalPages
        };

        res.render("admin/all_orders.ejs", obj);
    } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).send("Server Error");
    }
});


router.get("/delete_order/:order_id",adminAuth, async (req,res)=>{
  const orderId=req.params.order_id;
  await exe(`DELETE FROM user_orders WHERE order_id=?`,[orderId])
  res.redirect("/admin/all_orders");
});

router.get("/all_transactions", adminAuth, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const adminDpLogo = await exe(
        `SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,
        [1]
    );

    // ✅ Fetch transactions with LIMIT
    const tranData = await exe(
        `SELECT * FROM transaction ORDER BY transaction_id DESC LIMIT ? OFFSET ?`,
        [limit, offset]
    );

    // ✅ Get total count for pagination
    const totalRows = await exe(`SELECT COUNT(*) as count FROM transaction`);
    const totalPages = Math.ceil(totalRows[0].count / limit);

    res.render("admin/all_transactions.ejs", {
        adminDpLogo: adminDpLogo,
        tranData: tranData,
        currentPage: page,
        totalPages: totalPages,
        limit: limit
    });
});

router.get("/delete_transaction/:transaction_id",adminAuth, async (req,res)=>{
  const tranId=req.params.transaction_id;
  await exe(`DELETE FROM transaction WHERE transaction_id=?`,[tranId])
  res.redirect("/admin/all_transactions");
});

router.get("/footer_info",adminAuth, async (req,res)=>{
const footerDetails = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);
 const adminDpLogo = await exe(
        `SELECT admin_dp, admin_logo FROM admin_details WHERE admin_id = ?`,
        [1]
    );
  obj={
    footerDetails:footerDetails,
    adminDpLogo:adminDpLogo
  }
  res.render("admin/footer_info.ejs",obj);
});

router.post("/update_footer", adminAuth, async (req, res) => {
  try {
    const {
      quick_name1,
      quick_name2,
      quick_name3,
      quick_name4,
      quick_link1,
      quick_link2,
      quick_link3,
      quick_link4,
      service1,
      service2,
      service3,
      service4,
      footer_des
    } = req.body;

    const sql = `
      UPDATE footer_details 
      SET 
        quick_name1 = ?, 
        quick_name2 = ?, 
        quick_name3 = ?, 
        quick_name4 = ?, 
        quick_link1 = ?, 
        quick_link2 = ?, 
        quick_link3 = ?, 
        quick_link4 = ?, 
        service1 = ?, 
        service2 = ?, 
        service3 = ?, 
        service4 = ?, 
        footer_des = ?
      WHERE footer_id = 1
    `;

    await exe(sql, [
      quick_name1,
      quick_name2,
      quick_name3,
      quick_name4,
      quick_link1,
      quick_link2,
      quick_link3,
      quick_link4,
      service1,
      service2,
      service3,
      service4,
      footer_des
    ]);

    res.redirect("/admin/footer_info");
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Something went wrong ❌" });
  }
});


module.exports = router;
