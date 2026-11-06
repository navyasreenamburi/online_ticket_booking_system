const mysql=require("mysql2/promise");
module.exports=mysql.createPool({host:"localhost",user:"root",password:"navya2227",database:"navyaflix_db",waitForConnections:true,connectionLimit:10});