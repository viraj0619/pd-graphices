const express = require("express");
const router = express.Router();
const url = require("url");
const path = require("path");
const exe = require("../connection");
const fs = require("fs");
const axios = require("axios");


// const upload = require("../utils/multer"); // Go one directory up and into utils

const passport = require("passport");
const mysql = require('mysql2/promise'); // Use promise-based MySQL client
const bcrypt = require('bcrypt'); // For password hashing

const userLogin = (req, res, next) => {
  // Check if user session exists
  if (!req.session.user_id) {
    // User is not logged in
    // Optionally store the URL they were trying to access
    req.session.redirectTo = req.originalUrl;

    // Redirect them to the login page
    return res.redirect("/login");
  }

  // User is logged in, proceed to next middleware or route
  next();
};

// ✅ Home Page with Pagination
router.get("/", async (req, res) => {
  try {
const mostPerchese = await exe(`
  SELECT d.* 
  FROM design_files d
  JOIN (
    SELECT file_id 
    FROM design_files 
    ORDER BY file_perchesed DESC 
    LIMIT 4
  ) AS top4 
  ON d.file_id = top4.file_id
  ORDER BY d.file_perchesed DESC
`);
// console.log(mostPerchese);

    // Get total count of active files
    const countResult = await exe("SELECT COUNT(*) AS total FROM design_files WHERE status='active'");

await exe(
  `UPDATE admin_details SET website_views = website_views + 1 WHERE admin_id = ?`,
  [1]
);

    // Get paginated records
    const filesData = await exe(
      `SELECT * FROM design_files WHERE status='active' ORDER BY file_id DESC` );
   // Fetch Hero Section Data
const heroData = await exe(
  `SELECT * FROM hero_section WHERE hero_id = ?`,
  [1]
);

// Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);
    const userId=req.session.user_id;
    res.render("user/home.ejs", {
      filesData,
      heroData,
      mostPerchese,
      websiteInfo,
      cartCount,
      footerInfo,
      userId
    });

  } catch (error) {
    console.error("❌ Error fetching paginated files:", error);
    res.status(500).send("Something went wrong!");
  }
});
// Shop Route with Pagination
router.get("/shop", async (req, res) => {
  const page = parseInt(req.query.page) || 1;   // Current page (default 1)
  const limit = 20;                             // Show 20 cards per page
  const offset = (page - 1) * limit;

  // Get paginated files
  const filesData = await exe(
    `SELECT * FROM design_files 
     WHERE status='active' 
     ORDER BY file_id DESC 
     LIMIT ? OFFSET ?`, [limit, offset]
  );

  // Get total count for pagination
  const totalCount = await exe(
    `SELECT COUNT(*) AS count FROM design_files WHERE status='active'`
  );
  const totalPages = Math.ceil(totalCount[0].count / limit);

    // Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);
const userId=req.session.user_id;
  res.render("user/shop.ejs", {
    filesData,
    currentPage: page,
    totalPages,
     websiteInfo,
      cartCount,
      footerInfo,
      userId
  });
});

router.get("/login",async (req,res)=>{
  // Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);
const userId=req.session.user_id;

     res.render("user/login.ejs",
      {websiteInfo,
        cartCount,
        footerInfo,
        userId
      }
     );
} )

router.get("/register",async (req,res)=>{
     // Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);
const userId=req.session.user_id;
    res.render("user/register.ejs",
      {websiteInfo,
        cartCount,
        footerInfo,
        userId
      }
    );
});

router.get("/contact",async (req,res)=>{
     // Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);
const userId=req.session.user_id;

    res.render("user/contact.ejs",{
      websiteInfo,
      cartCount,
      footerInfo,
      userId
    });
})
router.post("/user_contact",async (req,res)=>{
    const data=req.body;
    const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
// console.log(todayDate)
   const addContact = await exe(
  `INSERT INTO user_contact(user_name, user_email, user_subject, user_message, date)
   VALUES (?, ?, ?, ?, ?)`,
  [data.user_name, data.user_email, data.user_subject, data.user_message, todayDate]
);
    res.redirect("/contact");
});
router.get("/process_card/:id", async (req,res)=>{
    const file_id=req.params.id;
    const user_id=req.session.user_id;
      const checkCartExist = await exe(
      `SELECT * FROM user_cart WHERE file_id = ? AND user_id = ?`,
      [file_id, user_id]
    );

    const fileData=await exe(`SELECT * FROM design_files WHERE file_id= ?`,[file_id]);
    await exe(`UPDATE design_files SET file_view = file_view + 1 WHERE file_id = ?`, [file_id]);
       // Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);
const userId=req.session.user_id;

    const obj={"fileData":fileData[0],"checkCartExist":checkCartExist,websiteInfo:websiteInfo,cartCount:cartCount,footerInfo:footerInfo,userId:userId}
    res.render("user/process_card.ejs",obj)
})
router.post("/register_user", async (req,res)=>{
   const data=req.body;
   const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
   const addUsers = await exe(`
  INSERT INTO users_register (
    username,
    firstname,
    lastname,
    email,
    password,
    confirmpassword,
    registerDate
  )VALUES
  (?, ?, ?, ?, ?, ?, ?)`,
[data.username,data.firstname,data.lastname,data.email,data.password,data.confirmpassword,todayDate,]);
    res.redirect("/login");
});
router.post("/user_login", async (req, res) => {
  try {
    const { login_identifier, password } = req.body;
    // console.log("Login Attempt:", login_identifier);

    const query = `
      SELECT * FROM users_register 
      WHERE (username = ? OR email = ?) AND password = ?
    `;
    const values = [login_identifier, login_identifier, password];
    const data = await exe(query, values);

    if (data.length > 0) {
      req.session.user_id = data[0].user_id;
    //   console.log("Login Successful:", data[0].user_id);

      const redirectTo = req.session.redirectTo 
      // || "/";
      delete req.session.redirectTo;
      res.json({ success: true, redirect: redirectTo });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false });
  }
});

router.get("/user_cart",userLogin,async (req,res)=>{
    const id=req.session.user_id;
 
  var cartData = await exe(`
  SELECT * 
  FROM user_cart 
  JOIN design_files ON user_cart.file_id = design_files.file_id 
  WHERE user_cart.user_id = ? AND design_files.status = 'active'
`, [id]);

   // Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);
const userId=req.session.user_id;

    const obj={userId:userId,"cartData":cartData,websiteInfo:websiteInfo,cartCount:cartCount,footerInfo:footerInfo};
    // console.log(cartData)
    res.render("user/user_cart.ejs",obj);
})
router.post("/add_cart/:id",userLogin, async (req, res) => {
  const file_id = req.params.id;
  const user_id = req.session.user_id;
  const qty = req.body.qty || 1; // Default quantity is 1 if not provided

  //  Prevent insertion if user_id or file_id is missing
  if (!user_id || !file_id) {
    console.warn("Missing user_id or file_id, not adding to cart.");
    return res.redirect("/login"); // or any page you want
  }

  try {
    // 1️⃣ Check if the item is already in the user's cart
    const checkCart = await exe(
      `SELECT * FROM user_cart WHERE file_id = ? AND user_id = ?`,
      [file_id, user_id]
    );

    if (checkCart.length > 0) {
      // ✅ Option 2: Update quantity (e.g., increase by 1)
      await exe(
        `UPDATE user_cart SET qty = qty + ? WHERE file_id = ? AND user_id = ?`,
        [qty, file_id, user_id]
      );
    } else {
      // 2️⃣ Insert into cart if not exists
      await exe(
        `INSERT INTO user_cart (file_id, user_id, qty) VALUES (?, ?, ?)`,
        [file_id, user_id, qty]
      );
    }

    res.redirect("/user_cart");
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/delete_cart/:id",userLogin, async (req,res)=>{
  const cart_id=req.params.id;
  const deleteCart=await exe (`DELETE FROM user_cart WHERE cart_id= ? `,[cart_id])
  res.redirect("/user_cart")
})

router.post('/update_cart_qty/:cart_id',userLogin, async (req, res) => {
  const cart_id = req.params.cart_id;
  const { qty } = req.body;

  try {
    await exe('UPDATE user_cart SET qty = ? WHERE cart_id = ?', [qty, cart_id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});
router.get("/user_profile",userLogin, async (req,res)=>{
 userData = await exe(`SELECT * FROM users_register WHERE user_id = ?`, [req.session.user_id]);
// console.log(userData);
   // Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);
   const userId=req.session.user_id;
const obj={userId:userId,"userData":userData[0],websiteInfo:websiteInfo,cartCount:cartCount,footerInfo:footerInfo}
  res.render("user/user_profile.ejs",obj);
});

router.get("/user_logout",userLogin, (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// Upload profile image
router.post("/upload_profile_image",userLogin, async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.status(401).json({ error: "User not logged in" });

    if (!req.files || !req.files.profile_photo) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Get current image from DB to delete it
    const [user] = await exe(`SELECT user_photo FROM users_register WHERE user_id = ?`, [userId]);
    const oldImagePath = user?.user_photo ? path.join(__dirname, "../public", user.user_photo) : null;

    const profileImage = req.files.profile_photo;
    const fileName = Date.now() + path.extname(profileImage.name);
    const uploadPath = path.join(__dirname, "../public/user/uploads", fileName);

    await profileImage.mv(uploadPath);

    const imagePath = "/user/uploads/" + fileName;

    // Save new path to DB
    await exe(`UPDATE users_register SET user_photo = ? WHERE user_id = ?`, [imagePath, userId]);

    // Delete old image if exists and not default
    if (oldImagePath && fs.existsSync(oldImagePath) && !oldImagePath.includes("profile-image.png")) {
      fs.unlinkSync(oldImagePath);
    }

    res.json({ imagePath });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete profile image
router.post("/delete_profile_image",userLogin, async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.status(401).json({ success: false });

    // Get current image path
    const [user] = await exe(`SELECT user_photo FROM users_register WHERE user_id = ?`, [userId]);
    const imagePath = user?.user_photo;

    // Delete from folder if not default image
    if (imagePath && !imagePath.includes("profile-image.png")) {
      const fullPath = path.join(__dirname, "../public", imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    // Remove from DB
    await exe(`UPDATE users_register SET user_photo = NULL WHERE user_id = ?`, [userId]);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ success: false });
  }
});

router.get("/user_setting",userLogin, async (req,res)=>{
     // Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);
const userId=req.session.user_id;
  res.render("user/user_setting.ejs",{
    websiteInfo,
    cartCount,
    footerInfo,
    userId
  });
});


router.post("/update_user_password",userLogin, async (req, res) => {
  const { user_password, user_newPassword } = req.body;
  const userId = req.session.user_id;

  try {
    // Get current stored (plain text) password
    const data = await exe("SELECT password FROM users_register WHERE user_id = ?", [userId]);

    if (data.length === 0) {
      return res.json({ success: false, message: "User not found." });
    }

    const storedPassword = data[0].password;

    // Compare old password with stored password
    if (user_password !== storedPassword) {
      return res.json({ success: false, message: "Old password is incorrect." });
    }

    // Update with new password
    await exe("UPDATE users_register SET password = ?, confirmpassword = ? WHERE user_id = ?", [
      user_newPassword,
      user_newPassword,
      userId
    ]);

    return res.json({ success: true, message: "Password updated successfully." });

  } catch (error) {
    console.error("Password update error:", error);
    return res.json({ success: false, message: "Error updating password." });
  }
});
 
router.post("/checkout/:id", userLogin, async (req, res) => {
  try {
    const fileId = req.params.id;
    const Qty = req.body.qty;

    // fileData query
    const fileData = await exe(
      "SELECT * FROM design_files WHERE file_id = ?",
      [fileId]
    );

    // userData query
    const userData = await exe(
      "SELECT * FROM users_register WHERE user_id = ?",
      [req.session.user_id]
    );

    // // countries API call
    // const response = await axios.get("https://countriesnow.space/api/v0.1/countries");
    // const countries = response.data.data.map(item => item.country);

       // Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);

  const userId=req.session.user_id;
    // अब object बना कर render करना
    const obj = {
      fileData: fileData,
      userData: userData,
      Qty: Qty,
      websiteInfo:websiteInfo,
      cartCount:cartCount,
      footerInfo:footerInfo,
      userId:userId
    };

    res.render("user/checkout.ejs", obj);

  } catch (error) {
    console.error(error);
    res.render("user/checkout.ejs", { countries: [], fileData: [], userData: [], Qty: 0 });
  }
});

router.get("/cart_checkout", userLogin, async (req, res) => {
  try {
    const userId = req.session.user_id;

    // Fetch Cart Data (only active + in stock)
    const cartData = await exe(
      `SELECT * 
       FROM user_cart 
       JOIN design_files ON user_cart.file_id = design_files.file_id 
       WHERE user_cart.user_id = ? 
       AND design_files.status = 'active' 
       AND design_files.stock = 'instock'`,
      [userId]
    );

    // Fetch User Data
    const userData = await exe(
      `SELECT * FROM users_register WHERE user_id = ?`,
      [userId]
    );

    // Fetch Website Info
    const websiteInfo = await exe(
      `SELECT * FROM admin_details WHERE admin_id = ?`,
      [1]
    );

    // Fetch Cart Count
    const cartCountResult = await exe(
      `SELECT COUNT(*) AS totalCount
       FROM user_cart 
       JOIN design_files ON user_cart.file_id = design_files.file_id 
       WHERE user_cart.user_id = ? 
       AND design_files.status = 'active'`,
      [userId]
    );
    const cartCount = cartCountResult[0]?.totalCount || 0;

    // Fetch Footer Info
    const footerInfo = await exe(
      `SELECT * FROM footer_details WHERE footer_id = ?`,
      [1]
    );

    // Final Object to Send
    const obj = {
      userData,
      cartData,
      cartCount,
      footerInfo,
      userId,
      websiteInfo,
    };

    res.render("user/cart_checkout.ejs", obj);

  } catch (error) {
    console.error(error);
    res.render("user/cart_checkout.ejs", { 
      userData: [], 
      cartData: [], 
      cartCount: 0, 
      footerInfo: [], 
      userId: null, 
      websiteInfo: [] 
    });
  }
});

// Checkout route → calculate cart total & create transaction
router.post("/process_checkout", userLogin, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const fileId = req.body.file_id;
    const fileQty = req.body.qty;

    let Amount = 0;
    let transactionId = null;

    // ✅ Common date
    const todayDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // ✅ Case 1: Shop Now (direct single product)
    if (fileId && fileQty) {
      const fileData = await exe(
        `SELECT * FROM design_files WHERE file_id = ?`,
        [fileId]
      );

      if (!fileData[0]) {
        return res.status(400).send("❌ Invalid file selected.");
      }

      Amount = fileData[0].final_price * fileQty;

      const insertTransactionSql = `
        INSERT INTO transaction (date, payment_type, payment_status, payment_amount, user_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      const transactionData = await exe(insertTransactionSql, [
        todayDate,
        "online",
        "pending",
        Amount,
        userId,
      ]);

      transactionId = transactionData.insertId;

    } 
    // ✅ Case 2: Add to Cart (multiple products checkout)
    else {
      const cartTotal = await exe(
        `SELECT SUM(qty * final_price) AS total
         FROM user_cart uc
         JOIN design_files df ON uc.file_id = df.file_id
         WHERE uc.user_id = ? AND df.stock = 'instock'`,
        [userId]
      );

      if (!cartTotal[0] || cartTotal[0].total <= 0) {
        return res.send("❌ Cart is empty.");
      }

      Amount = cartTotal[0].total;

      const insertTransactionSql = `
        INSERT INTO transaction (date, payment_type, payment_status, payment_amount, user_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      const transactionData = await exe(insertTransactionSql, [
        todayDate,
        "online",
        "pending",
        Amount,
        userId,
      ]);

      transactionId = transactionData.insertId;
    }

    // ✅ Get Admin details (branding/payment info)
    const adminDetails = await exe(`SELECT * FROM admin_details LIMIT 1`);

    // ✅ Render payment page
    // const fileData={"fileId":fileId,"fileQty":fileQty}
    // console.log(fileData.fileId)
       // Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);
    res.render("user/payment_page.ejs", {
      adminDetails: adminDetails[0],
      amount: Amount,
      transaction_id: transactionId,
      orderDetails: { ...req.body, user_id: userId }, // ✅ Ensure user_id is passed
      websiteInfo:websiteInfo,
      cartCount:cartCount,
      footerInfo:footerInfo,
      userId
    });

  } catch (err) {
    console.error("Checkout Error:", err);
    res.status(500).send("Something went wrong during checkout.");
  }
});


// Save Payment & Place Order
router.post("/save_payment/:transaction_id", async (req, res) => {
  try {
    const { transaction_id } = req.params;
    const { 
      razorpay_payment_id, user_id, first_name, last_name,
      user_email, user_mobile, country, state, district, file_id, qty
    } = req.body;

    // 1️⃣ Validation
    if (!razorpay_payment_id || !transaction_id || !user_id) {
      return res.status(400).send("❌ Missing payment details.");
    }

    // 2️⃣ Update Transaction Table
    await exe(
      `UPDATE transaction 
       SET payment_id = ?, payment_status = 'success' 
       WHERE transaction_id = ?`,
      [razorpay_payment_id, transaction_id]
    );

    const todayDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // 3️⃣ SHOP NOW Flow (Direct single product purchase)
    if (file_id && qty) {
      const fileData = await exe(
        `SELECT * FROM design_files WHERE file_id = ?`,
        [file_id]
      );

      if (fileData.length === 0) {
        return res.status(404).send("❌ Product not found.");
      }

      const product = fileData[0];

      // Insert into user_orders
      await exe(
        `INSERT INTO user_orders 
        (first_name, last_name, user_email, user_mobile, country, state, district,
        file_id, qty, design_name, final_price, total_price, transaction_id, 
        order_status, order_date, download_count, user_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          first_name, last_name, user_email, user_mobile, country, state, district,
          product.file_id, qty, product.design_name, product.final_price,
          product.final_price * qty, transaction_id, "success", todayDate, qty, user_id
        ]
      );

      // जर हे product आधीच cart मध्ये असेल तर delete करा
      await exe(
        `DELETE FROM user_cart WHERE user_id = ? AND file_id = ?`,
        [user_id, file_id]
      );

    } else {
      // 4️⃣ ADD TO CART Flow (multiple products checkout)
      const carts = await exe(
        `SELECT uc.*, df.design_name, df.final_price 
         FROM user_cart uc
         JOIN design_files df ON uc.file_id = df.file_id
         WHERE uc.user_id = ? AND df.stock = 'instock'`,
        [user_id]
      );

      if (carts.length === 0) {
        return res.redirect("/user_orders");
      }

      // Insert each cart item into user_orders
      for (const cart of carts) {
        await exe(
          `INSERT INTO user_orders 
          (first_name, last_name, user_email, user_mobile, country, state, district,
          file_id, qty, design_name, final_price, total_price, transaction_id, 
          order_status, order_date, download_count, user_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            first_name, last_name, user_email, user_mobile, country, state, district,
            cart.file_id, cart.qty, cart.design_name, cart.final_price,
            cart.final_price * cart.qty, transaction_id, "success", todayDate, cart.qty, user_id
          ]
        );
      }

      // Clear entire cart
      await exe(
        `DELETE uc 
         FROM user_cart uc
         JOIN design_files df ON uc.file_id = df.file_id
         WHERE uc.user_id = ? AND df.stock = 'instock'`,
        [user_id]
      );
    }

    // 5️⃣ Redirect to orders page
    res.redirect("/user_orders");

  } catch (error) {
    console.error("💥 Payment Save Error:", error);
    res.status(500).send("Something went wrong while saving payment.");
  }
});


router.get("/user_orders",userLogin, async (req,res)=>{
const orderData = await exe(
  `SELECT user_orders.*, design_files.* 
   FROM user_orders 
   INNER JOIN design_files 
   ON user_orders.file_id = design_files.file_id 
   WHERE user_orders.user_id = ? 
   ORDER BY user_orders.order_id DESC`,
  [req.session.user_id]
);
   // Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);

const userId=req.session.user_id;
 const obj={
    orderData:orderData,
    websiteInfo:websiteInfo,
    cartCount:cartCount,
    footerInfo:footerInfo,
    userId:userId
   }
  res.render("user/user_orders.ejs",obj)
});

router.get("/invoice_order/:id", userLogin, async (req, res) => {
  try {
    const transactionId = req.params.id;

const orderData = await exe(
  `SELECT 
  transaction.*,   
  user_orders.*, 
  design_files.file_price,
  file_dis
FROM transaction
INNER JOIN user_orders 
  ON transaction.transaction_id = user_orders.transaction_id
INNER JOIN design_files 
  ON user_orders.file_id = design_files.file_id
WHERE transaction.transaction_id = ?;`,
  [transactionId]
);
// console.log(orderData)
   const companyData=await exe(`select * from admin_details where admin_id = ?`,[1])
      // Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);
const userId=req.session.user_id;

   obj={
    orderData:orderData,
    companyData:companyData,
    websiteInfo:websiteInfo,
    cartCount:cartCount,
    footerInfo:footerInfo,
    userId:userId
   }
    res.render("user/invoice_order.ejs",obj);
  } catch (error) {
    console.error("Error in invoice_order route:", error);
    res.status(500).send("Server Error");
  }
});

router.get("/download_file/:order_id",userLogin,async (req, res) => {
  try {
    const { order_id } = req.params;

    // ✅ Fetch order with main_file from design_files
 const updateDownloads_count = await exe(`
  UPDATE design_files df
  JOIN user_orders uo ON df.file_id = uo.file_id
  SET df.file_perchesed = df.file_perchesed + 1
  WHERE uo.order_id = ?
`, [order_id]);

    const order = await exe(
      `SELECT uo.*, df.main_file 
       FROM user_orders uo
       INNER JOIN design_files df ON uo.file_id = df.file_id
       WHERE uo.order_id = ? AND uo.user_id = ?`,
      [order_id, req.session.user_id]
    );

    if (order.length === 0) {
      return res.status(404).send("Order not found");
    }

    // ✅ Check download_count
    if (order[0].download_count <= 0) {
  return res.redirect("/user_orders"); // direct redirect to orders page
    }

    // ✅ Path for file
    const filePath = path.join(__dirname, "../public/designZipfiles", order[0].main_file);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    // ✅ Decrement download_count
    await exe(
      "UPDATE user_orders SET download_count = download_count - 1 WHERE order_id = ?",
      [order_id]
    );

    // ✅ Send file
    return res.download(filePath, order[0].main_file);

  } catch (err) {
    console.error("Download Error:", err);
    res.status(500).send("Server error");
  }
});

// Route: Get User Details Page
router.get("/user_details", userLogin, async (req, res) => {
  try {
    const userId = req.session.user_id;

    const userDetails = await exe(
      "SELECT * FROM users_register WHERE user_id = ?",
      [userId]
    );
       // Fetch Website Info (Admin Details)
const websiteInfo = await exe(
  `SELECT * FROM admin_details WHERE admin_id = ?`,
  [1]
);

// Fetch Cart Count for Current User
const cartCountResult = await exe(
  `SELECT COUNT(*) AS totalCount
   FROM user_cart 
   JOIN design_files ON user_cart.file_id = design_files.file_id 
   WHERE user_cart.user_id = ? 
   AND design_files.status = 'active'`,
  [req.session.user_id]
);
const cartCount = cartCountResult[0]?.totalCount || 0; // Ensure number (default 0)

// Fetch Footer Details
const footerInfo = await exe(
  `SELECT * FROM footer_details WHERE footer_id = ?`,
  [1]
);

   const obj={
      userDetails:userDetails[0],
      websiteInfo:websiteInfo,
      cartCount:cartCount,
      footerInfo:footerInfo,
      userId:userId
    }
    
    res.render("user/user_details.ejs",obj);

  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).render("error.ejs", { message: "Internal Server Error" });
  }
});

router.post("/update_user_details", userLogin, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { firstname, lastname, username, user_mobile, email } = req.body;

    const updateUserDetails = await exe(
      `UPDATE users_register
       SET firstname = ?, lastname = ?, username = ?, user_mobile = ?, email = ? 
       WHERE user_id = ?`,
      [firstname, lastname, username, user_mobile, email, userId]
    );

    if (updateUserDetails.affectedRows > 0) {
      res.redirect("/user_profile"); // ✅ Redirect to profile page (change if needed)
    } else {
      res.send("No changes were made.");
    }
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).send("Something went wrong, please try again.");
  }
});

// 🔍 Search Route
router.get("/search", async (req, res) => {
  try {
    // Get search keyword from query string (?q=...)
    const keyword = req.query.q ? req.query.q.trim() : "";

    console.log("Search keyword:", keyword); // Debugging

    let results = [];

    if (keyword) {
      // Fetch matching results from DB
      results = await exe(
        `SELECT * 
         FROM design_files 
         WHERE status = 'active'
         AND (LOWER(design_name) LIKE LOWER(?) 
              OR LOWER(categories) LIKE LOWER(?))`,
        [`%${keyword}%`, `%${keyword}%`]
      );
    }

    // Render Search Page
    res.render("user/search.ejs", { 
      results, 
      keyword 
    });

  } catch (error) {
    console.error("Search error:", error);
    res.render("user/search.ejs", { results: [], keyword: "" });
  }
});

module.exports = router;
