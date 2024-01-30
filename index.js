import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";

const app=express();
const port=3000;
const saltRounds=10;
env.config();

app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:true,
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

var allblogs=[];


app.get("/",async (req,res)=>{
    
    try {
        const result= await db.query("SELECT * FROM blog ORDER BY id ASC");
        const blogs=result.rows;

        const loggedin=req.isAuthenticated();

        allblogs=blogs;

        res.render("index.ejs",{
        listBlogs:allblogs, loggedin:loggedin
      });
        
      } catch (err) {
        console.log(err);
      }
})

app.get("/create",(req,res)=> {
    if(req.isAuthenticated()){
    res.render("create.ejs",{listBlogs:allblogs,loggedin:true});
    }
    else{
      res.redirect("/login");
    }
})

app.get("/login",(req,res)=>{
   res.render("login.ejs",{loggedin:false});
});

app.get("/register", (req, res) => {
  res.render("register.ejs",{loggedin:false});
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/userblogs",async (req,res)=>{
    
  if(req.isAuthenticated()){
  try {
      const result= await db.query("SELECT * FROM blog WHERE authorid=$1",[req.user.id]);
      const blogs=result.rows;

      res.render("userblogs.ejs",{
      listBlogs:blogs, loggedin:true
    });
      
    } catch (err) {
      console.log(err);
    }
  }
  else{
    res.redirect("/");
  }
})

app.post("/submit",async (req,res)=>{

    if(req.isAuthenticated()){
    try {
      await db.query("INSERT INTO blog (blog_title,blog_description,authorid) VALUES (($1),($2),($3))", [req.body.blogtitle,req.body.blogdescription,req.user.id]);
      res.redirect("/");
    
    } catch (err) {
      console.log(err);
    }  
  }
  else
  {
    res.redirect("/login");
  }
});

app.post('/updatepost', async (req, res) => {
    //console.log(req.body);
    if(req.isAuthenticated()){
    const id=req.body.updatebutton;
    try {
        const result=await db.query("SELECT * FROM blog WHERE id=$1", [id]);
        const blog=result.rows;
        res.render("update.ejs",{listBlogs:allblogs,Blog:blog,loggedin:false});
      
      } catch (err) {
        console.log(err);
      }  
    }
    else{
      res.redirect("/login");
    }
    
    
});
app.post('/delete', async (req, res) => {
   if(req.isAuthenticated()){
    const id=req.body.deletebutton;
    try {
        await db.query("DELETE FROM blog WHERE id=$1", [id]);
        res.redirect("/");
      
      } catch (err) {
        console.log(err);
      }  
    }
    else{
      res.redirect("/login");
    }
    
});

app.post("/updatesubmit",async (req,res)=>{
    try {
        await db.query("UPDATE blog SET blog_title=($1),blog_description=($2) WHERE id=$3", [req.body.blogtitle,req.body.blogdescription,req.body.updatedItemId]);
        res.redirect("/");
      
      } catch (err) {
        console.log(err);
      }  
    
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

app.post("/register", async (req,res)=>{
  const email = req.body.email;
  const password = req.body.password;
  const username=req.body.username;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.redirect("/login");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING *",
            [email, hash,username]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

passport.use(
  "local",
  new Strategy(async function verify(email, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        email,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});


app.listen(port,()=>{
    console.log(`Listening on port ${port}`)
})
