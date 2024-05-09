const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const uuid = require("uuid").v4; // Import uuid library

app.use(express.json());
app.use(cors());

// database Connection with MongoDB
mongoose.connect("mongodb+srv://ponocrafts:DaDa.2000@cluster0.70lulcg.mongodb.net/ecommerce");

// API Creation

app.get("/", (req, res) => {
    res.send("Express app is Running")

})

// Image Storage Engine
const storage = multer.diskStorage({
    destination: "./upload/images",
    filename: (req, file, cb) => {
        if (!file) {
            return cb(new Error("No file provided"));
        }
        const uniqueFilename = `${uuid()}${path.extname(file.originalname)}`; // Generate unique filename using uuid
        cb(null, uniqueFilename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        files: 4
    }
});

// Creating Upload Endpoint for image
app.post("/upload", upload.array("image", 4), (req, res) => {
    const image_urls = req.files.map(file => {
        return `${req.protocol}://${req.get('host')}/${file.path.replace(/\\/g, '/')}`;
    });
    res.json({ success: true, image_urls });
});


// Schema for Creating Products
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        require: true,
    },
    name: {
        type: String,
        require: true,
    },
    image_urls: [{
        type: String,
        require: true,
    }],
    category: {
        type: String,
        require: true,
    },
    new_price: {
        type: Number,
        require: true,
    },
    old_price: {
        type: Number,
        require: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },

})

app.post("/addproduct", async (req, res) => {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    }
    else {
        id = 1;
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image_urls: req.body.image_urls,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success: true,
        name: req.body.name,
    })

})

//Creating API for deleting Products

app.post("/removeproduct", async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name
    })
})

// Creating API for getting all products
app.get("/allproducts", async (req, res) => {
    let products = await Product.find({})
    console.log("All products Fetched");
    res.send(products)
})

//Schema creting for User model
const Users = mongoose.model("Users", {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    }
})

//Creating endpoint for new collection data
app.get('/newcollections', async (req, res) => {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("Newcollection Fetched");
    res.send(newcollection);
})

//Creating endpoint for new poppular in women
app.get('/popularinnunta', async (req, res) => {
    let products = await Product.find({ category: "nunta" });
    let popular_in_wedding = products.slice(0, 4);
    console.log("Popular in women Fetched");
    res.send(popular_in_wedding);

})


//Creating endpoint for all product
app.get('/allproductsHero', async (req, res) => {
    let products = await Product.find({});
    let all_in_products = products.slice(0, 25);
    console.log("Hero product fetched");
    res.send(all_in_products);

})
//Creating endpoint for offers
app.get('/offerproducts', async (req, res) => {
    let products = await Product.find({ category: "botez" });
    let offer_products = products.slice(0, 4);
    console.log("Offer fetched!");
    res.send(offer_products);

})

app.listen(port, (error) => {
    if (!error) {
        console.log("Server Running on Port " + port)
    } else {
        console.log("Error:" + error)
    }
})