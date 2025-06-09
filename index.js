require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

const uri = `mongodb+srv://${process.env.MONGO_NAME}:${process.env.MONGO_PASS}@cluster-1.${process.env.CLUSTER_CODE}.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-1`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
var admin = require("firebase-admin");

var serviceAccount = require("./assignment-11-authentication.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    req.decoded = decoded;
    next();
  } catch (err) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
};

async function run() {
  try {
    await client.connect();

    const blogCollection = client.db("blogCollection").collection("blogs");
    const commentCollection = client.db("blogCollection").collection("comments");
    const wishlistCollection = client.db("blogCollection").collection("wishlist");

    app.get("/blog", async (req, res) => {
      const { category, searchedText } = req.query;
      const filter = {};

      if (category) {
        filter.category = category;
      }
      if (searchedText) {
        filter.title = { $regex: searchedText, $options: "i" };
      }

      const result = await blogCollection.find(filter).toArray();
      res.send(result);
    });

    app.get("/blog/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });
    app.get("/recent-blog", async (req, res) => {
      const result = await blogCollection.find().limit(6).toArray();
      res.send(result);
    });

    app.put("/blog/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateData = req.body;
      const updatedDoc = {
        $set: updateData,
      };
      const result = await blogCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.post("/blog", async (req, res) => {
      const data = req.body;
      const result = await blogCollection.insertOne(data);
      res.send(result);
    });

    app.get("/comment", async (req, res) => {
      const result = await commentCollection.find().toArray();
      res.send(result);
    });

    app.post("/comment", async (req, res) => {
      const data = req.body;
      const result = await commentCollection.insertOne(data);
      res.send(result);
    });

   app.get("/wishlist", verifyFirebaseToken, async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send({ error: "Email is required" });
  }

    const result = await wishlistCollection.find({ loggedEmail: email }).toArray();
    res.send(result);
  
});


app.delete('/wishlist/:id', verifyFirebaseToken, async (req, res) => {
  const wishlistId = req.params.id;
  const userEmail = req.query.email;

    const result = await wishlistCollection.deleteOne({
      _id: new ObjectId(wishlistId),
      loggedEmail: userEmail,
    });

    if (result.deletedCount === 1) {
      res.send({ success: true, message: 'Item deleted successfully' });
    } else {
      res.status(403).send({ success: false, message: 'Unauthorized or item not found' });
    }
  
});


   app.post('/wishlist', async (req, res) => {
  const { _id: blogId, loggedEmail, ...rest } = req.body;

  if (!blogId || !loggedEmail) {
    return res.status(400).send({ error: "Missing blogId or loggedEmail" });
  }

  const existsAlready = await wishlistCollection.findOne({
    blogId,
    loggedEmail,
  });

  if (existsAlready) {
    return res.send({ insertedId: false, message: 'Already in wishlist' });
  }

  const newItem = {
    ...rest,
    blogId,     
    loggedEmail, 
  };

  const result = await wishlistCollection.insertOne(newItem);
  res.send(result);
});




    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
