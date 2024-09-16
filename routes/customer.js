var express = require("express");
var router = express.Router();
const customerModel = require("../models/customer.model");
const multer = require("multer");
const { body, validationResult } = require("express-validator");

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images");
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}.jpg`);
  },
});

const upload = multer({ storage: diskStorage });

/* GET home page. */
router.get("/", async (req, res) => {
  const customers = await customerModel.find();
  res.render("customer/index", { title: "Customer List", customers });
});

router.get("/search", async (req, res) => {
  const customers = await customerModel.find({
    email: new RegExp(req.query.keyword),
  });
  res.render("customer/index", { title: "Customer List", customers });
});

router.get("/create", (req, res) => {
  res.render("customer/create", { title: "Create Customer" });
});

router.post("/create",
  [
    upload.single("photo"),
    body("fullname").notEmpty().withMessage("Please input Fullname"),
    body("email")
      .notEmpty()
      .withMessage("Please input Email")
      .isEmail()
      .withMessage("Email form is wrong!")
      .custom(async (value) => {
        const existed = await customerModel.findOne({ email: value });
        if (existed) {
          throw new Error("Email is existed. Please input other email!.");
        }
      }),
    body("password").notEmpty().withMessage("Please input Password"),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    // if (!errors.isEmpty()) {
    //   // console.log(errors)
    //   return res.render("customer/create", {
    //     title: "Create Customer",
    //     errors: errors.array(),
    //   });
    // }

    let cust = new customerModel(req.body);
    cust.image = req.file.filename;
    await cust.save();
    res.redirect("/customer");
  }
);

router.get("/delete/:id", async (req, res) => {
  await customerModel.findByIdAndDelete(req.params.id)
  res.redirect('/customer')
})

router.get('/update/:id', async (req, res) => {
  let customer = await customerModel.findById(req.params.id)
  res.render('customer/update', { customer })
})

router.post('/update/:id', upload.single('photo'), async (req, res) => {
  const body = req.body
  const image = req.file
  let customer = await customerModel.findById(req.params.id)
  customer.fullname = body.fullname
  customer.email = body.email
  customer.password = body.password
  if (image) {
    customer.image = image.filename
  }
  try {
    await customer.save()
    res.redirect('/customer')
  } catch (err) {
    res.redirect('/customer/error')
  }
})
module.exports = router;
