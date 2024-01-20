import express from "express";
import bodyParser from "body-parser";

const app=express();
const port=3000;

var clickedIndex=-1;

var titles=[];
var description=[];


app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.get("/",(req,res)=>{
    res.render("index.ejs",{titles:titles,description:description});
})
app.get("/create",(req,res)=> {
    
    res.render("create.ejs",{titles:titles,description:description});
})
app.post('/updatepost', (req, res) => {
    //console.log(req.body);
    clickedIndex=req.body.updatebutton;
    res.render("update.ejs",{titles:titles,description:description,clickedIndex:clickedIndex});
    
});
app.post('/delete', (req, res) => {
    let deleteclickedIndex=req.body.deletebutton;
    titles.splice(deleteclickedIndex,1);
    description.splice(deleteclickedIndex,1);
    res.render("index.ejs",{titles:titles,description:description});
    
});

app.post("/updatesubmit",(req,res)=>{
    titles[clickedIndex-1]=req.body.blogtitle;
    description[clickedIndex-1]=req.body.blogdescription;
    res.render("index.ejs",{titles:titles,description:description})
})
app.post("/submit",(req,res)=>{
    titles.unshift(req.body.blogtitle);
    description.unshift(req.body.blogdescription);
    res.render("index.ejs",{titles:titles,description:description})
})

app.listen(port,()=>{
    console.log(`Listening on port ${port}`)
})
