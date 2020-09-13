const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const mysql = require('mysql');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');
const passport = require('passport');
const bcrypt = require('bcrypt');
const path = require('path');
const methodOverride=require('method-override');
const expressHbs= require('express-handlebars');
var Cart=require('./models/cart')

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(express.json());
app.use(methodOverride('_method'))
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static('public'));
var sessUser;

var mysqlConnection = mysql.createConnection({
	host : "localhost",
	user : "root",
	password : "root",
	database : "information",
	multipleStatements : true
});

mysqlConnection.connect((err)=>{
	if(!err)
	{
		console.log("Connected");
	}
	else
	{
		console.log("Connection failed");
	}
});


app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));


/*app.get('/', (req, res) => {
  res.render('index.ejs')
})*/





app.get('/', (req, res) => {
  res.render('login.ejs')
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

function checkAuthenticated(req, res, next) {
  if (req.session.loggedin) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.session.loggedin) {
    if(req.session.usertype=="buyer"){
    	return res.redirect('/buyerhome');
    }else{
    	return res.redirect('sellerhome');
    }
  }

  next();
}

app.delete('/logout', (req,res)=>{
	req.session.loggedin=false;
	req.logOut();
	res.redirect('/login')
})

app.post('/login', checkNotAuthenticated, async (req,res)=>{
	try{
		//const hashedPassword = await bcrypt.hash(req.body.password, 10)
		var email = req.body.email;
		var password = req.body.password;
		//var email = usersinfo.find(user => user.email === email);

		var sql = "SELECT * FROM usersinfo WHERE email = ?";
			mysqlConnection.query(sql, [email], function(err, result) {
				if (err) throw err;
				//console.log(result[0]);
				//console.log(result[0].pass_word);
				//console.log(password);
				if(!result.length) {
					console.log("incorrect");
					res.send('Incorrect Email or Password!');
				}else{
					console.log(bcrypt.compare(password,result[0].pass_word));
		
				if(bcrypt.compare(password,result[0].pass_word)){
					req.session.loggedin=true;
					req.session.username = result[0].username;
					req.session.usertype=result[0].usertype;
					sessUser=result[0].username;
					if(result[0].usertype=="buyer"){
						res.redirect('/buyerhome');
						console.log(req.session.username);
					}
					else{
						res.redirect('/sellerhome');
						console.log(req.session.username);
					}
					//req.session.loggedin = true;
				}
					
				}		
				res.end();
			});
		
	}catch{
		res.redirect('/login');
	}
	
	
})

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req,res)=>{
	try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    var values=[
      [req.body.name,
      req.body.username,
      req.body.email,
      hashedPassword,
      req.body.usertype]
    ];
     var sql = "INSERT INTO usersinfo (name, username, email, pass_word, usertype) VALUES ?";
    mysqlConnection.query(sql, [values], function (err, result) {
    if (err) throw err;
    res.redirect('/login');
    });
  } catch {
    res.redirect('/register')
  }
  console.log(values);

});

app.get('/addproducts', checkAuthenticated, (req, res) => {
	res.render('addproducts')
})

app.get('/searchitem', checkAuthenticated, (req, res) => {
  
   res.render('searchitem');

});

app.post('/searchitem',checkAuthenticated, (req,res)=>{
  var item=req.body.searchitem;
  console.log(req.body.searchitem);
  var sql=`SELECT * FROM items WHERE itemname='${item}'`;
   mysqlConnection.query(sql, function (err, data, fields) {
      if (err) throw err;
      console.log(data);
      res.render('searchitem', {userData: data});
    });
});

app.get('/buyerhome', checkAuthenticated, (req, res) => {
	var sql='SELECT * FROM items';
    mysqlConnection.query(sql, function (err, data, fields) {
    	if (err) throw err;
    	res.render('buyerhome', {userData: data});
  	});

  //res.render('buyerhome.ejs')
})

app.get('/buyerinfo', checkAuthenticated, (req, res) => {
	var sql=`SELECT purchases FROM usersinfo`;
	mysqlConnection.query(sql, function (err, data, fields) {
    	if (err) throw err;
    	var arr=[];
    	for(var i=0;i<data.length;i++){

    	 console.log(JSON.parse(data[i].purchases));
       info=JSON.parse(data[0].purchases);
       console.log(info);
       console.log(info[0]);
       if(JSON.parse(data[i].purchases)==null){
        continue;
       }else{
        info=JSON.parse(data[i].purchases);
        if(info[0].item.username==req.session.username){
          arr.push(JSON.parse(data[i].purchases));
        }

    	 //arr.push(JSON.parse(data[i].purchases));

      }
    	 console.log("array"+arr);

    	}
    	res.render('buyerinfo', {userData: JSON.parse(data[0].purchases)});
  	});
	//res.render('buyerinfo');

});

app.get('/buyerpurchases', checkAuthenticated, (req, res) => {
	var sql=`SELECT purchases FROM usersinfo WHERE username='${req.session.username}'`;
	mysqlConnection.query(sql, function (err, data, fields) {
    	if (err) throw err;
    	console.log(JSON.parse(data[0].purchases));
    	res.render('buyerpurchases', {pdts: JSON.parse(data[0].purchases)});
  	});
});

app.get('/cart/:id', (req, res,next) => {
	var productId=req.params.id;
	var cart=new Cart(req.session.cart?req.session.cart:{});
	var sql='SELECT * FROM items where id = ' + mysql.escape(productId);
	 mysqlConnection.query(sql, function (err, data, fields) {
    	if (err) throw err;
    	cart.add(data[0], data[0].id);
    	req.session.cart=cart;

    	console.log(req.session.cart)
    	res.redirect('/buyerhome')
  	});



});

app.get('/checkout', (req,res)=>{
	var cart= new Cart(req.session.cart);
	console.log(cart.generateArray());
	var pdts=JSON.stringify(cart.generateArray());
	console.log(pdts);
	var sql=`UPDATE usersinfo SET purchases='${pdts}' WHERE username='${req.session.username}'`;
	 mysqlConnection.query(sql, function (err, result) {
    if (err) throw err;

    });
	req.session.cart=null;
	res.render('checkout');
})

app.get('/cart', (req,res,next)=>{
	if(!req.session.cart){
		return res.render('cart',{products:null});
	}
	var cart= new Cart(req.session.cart);
	console.log(cart.generateArray());
	/*var pdts=JSON.stringify(cart.generateArray());
	console.log(pdts);
	var sql=`UPDATE usersinfo SET purchases='${pdts}' WHERE username='${req.session.username}'`;
	 mysqlConnection.query(sql, function (err, result) {
    if (err) throw err;

    });*/
	
	res.render('cart', { title: 'NodeJS Shopping Cart',
    products: cart.generateArray(),
    totalPrice: cart.totalPrice});
})

app.get('/edit', (req, res) => {
	var uname=req.session.username;
	console.log(uname);
	var sql='SELECT * FROM items where username = ' + mysql.escape(uname);
    mysqlConnection.query(sql, function (err, data, fields) {
    	if (err) throw err;
    	res.render('edit', {userData: data});
  	});
  //res.render('edit',{userData: data});
});

app.post('/edit', (req, res) => {
	var values=[
      [req.body.itemname,
      req.body.price,
      req.body.id
      ]
    ];
    console.log(values);
     var sql = "UPDATE items SET itemname=?, price=? WHERE id=?";

    mysqlConnection.query(sql, [req.body.itemname, req.body.price, req.body.id], function (err, result) {
    if (err) throw err;
    res.redirect('/edit');      
           });

    console.log("updated successfully ");
	//res.redirect('/edit')
});

app.get('/sellerhome', checkAuthenticated, (req, res) => {
	var uname=req.session.username;
	console.log(uname);
	var sql='SELECT * FROM items where username = ' + mysql.escape(uname);
    mysqlConnection.query(sql, function (err, data, fields) {
    	if (err) throw err;
    	res.render('sellerhome', {userData: data});
  	});
 
});

app.post('/sellerhome',checkAuthenticated, (req,res)=>{
	//var sessUser=req.session.username;
	console.log(req.session.username);
	var values=[
      [req.body.itemname,
      req.body.price,
      req.body.quantity,
      req.body.description,
      req.body.image,
      req.session.username
      ]
    ];
     var sql = "INSERT INTO items (itemname, price,quantity,description,image,username) VALUES ?";
    mysqlConnection.query(sql, [values], function (err, result) {
    if (err) throw err;
    res.redirect('/sellerhome');      
           });

    console.log("inserted successfully ");
});

app.listen(3000, ()=>console.log("Listening on port 3000"));