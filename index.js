const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

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
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({ storage: storage })

// Creating  Uploade Endpoint for image
app.use("/images", express.static("upload/images"))

app.post("/upload", upload.single("product"), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })

})

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
    image: {
        type: String,
        require: true,
    },
    category: {
        type: String,
        require: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        require: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    avilable: {
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
        image: req.body.image,
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

//Creating Endpoint for registering the user

app.post("/signup", async (req, res) => {
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, errors: "Există un cont creeat cu aceeași adresă de email!" })
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }
    const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    })
    await user.save();

    const data = {
        user: {
            id: user.id

        }
    }
    const token = jwt.sign(data, "secret_ecom");
    res.json({ success: true, token })
})

//Creating Endpoint for the user login

app.post("/login", async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, "secret_ecom");
            res.json({ success: true, token });
        }
        else {
            res.json({ success: false, errors: "Parolă greșită! Mai încearcă!" });
        }
    }
    else {
        res.json({ success: false, errors: "Email greșit!Mai încearcă!" });
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
    let products = await Product.find({ category:"nunta"});
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
    let products = await Product.find({ category:"botez"});
    let offer_products = products.slice(0, 4);
    console.log("Offer fetched!");
    res.send(offer_products);

})

//creating dillelware to fetch user

const fetchUser = async (req, res, next) => {
    const token = req.header("auth-token");
    if (!token) {
        res.status(401).send({ errors: "Te rog să te autetifici mai întâi!" });
    }
    else {
        try {
            const data = jwt.verify(token, "secret_ecom");
            req.user = data.user;
            next();

        } catch (error){
            res.status(401).send({errors: "Te rog să te autetifici mai întâi!"})
        }
    }
}

//creating endpoint for adding products in cartdata

app.post("/addtocart", fetchUser, async (req, res) => {
    console.log("added", req.body.itemId);
    let userData =await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] +=1;
    await Users.findOneAndUpdate({_id:req.user.id}, {cartData:userData.cartData});
    res.send(JSON.stringify("Produs adăugat!"));

})

// creating endpoint to remove product from cart
app.post('/removefromcart', fetchUser, async (req,res)=>{
    console.log("removed", req.body.itemId);
    let userData =await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -=1;
    await Users.findOneAndUpdate({_id:req.user.id}, {cartData:userData.cartData});
    res.send(JSON.stringify("Produs șters!"));
})

// creating endpoint to get cartdata
app.post('/getcart',fetchUser, async(req,res)=>{
    console.log("GetCart");
    let userData= await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})

app.listen(port, (error) => {
    if (!error) {
        console.log("Server Running on Port " + port)
    } else {
        console.log("Error:" + error)
    }
})