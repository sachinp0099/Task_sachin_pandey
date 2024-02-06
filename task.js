let express = require("express");
let joi = require("joi");
let app = express();
let {Sequelize, Model, DataTypes,QueryTypes, Op} = require("sequelize");
let sequelizeCon = new Sequelize("mysql://root@localhost/task");

app.use(express.json());
app.use(express.urlencoded({extended:true}));

sequelizeCon.authenticate().then(()=>{
    console.log("database is connected");
}).catch((error)=>{
    console.log("database is not connected");
})

// category schema

class Category extends Model{ }
 Category.init({
    id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    cName:{
        type: DataTypes.STRING,
        allowNull: false
    },
    description:{
        type: DataTypes.STRING(100),
        allowNull: false
    },
 },{tableName:"category", modelName:"Category", sequelize:sequelizeCon})

 // product schema

 class Product extends Model{ }
 Product.init({
    id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    name:{
        type: DataTypes.STRING,
        allowNull: false
    },
    price:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    description:{
        type: DataTypes.STRING(150),
        allowNull: false
    },
    slug:{
        type:DataTypes.STRING(150),
        allowNull: false
    },
    categoryId:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
 },{tableName:"product", modelName:"Product", sequelize:sequelizeCon});
 
//  sequelizeCon.sync({alter:true})

 // create category joi validation

 async function checkCategory(data){
    let schema = joi.object({
        cName: joi.string().required(),
        description: joi.string().required()
    })
    let valid = await schema.validateAsync(data).catch((error)=>{ return {error}})
        if(!valid || (valid && valid.error)){
            let msg = []
            for (let i of valid.error.details){
                msg.push(i.message)
            }
            return {error:msg}
        }
        return {data:valid}
    }


// create category
app.post('/category/add', async(req,res)=>{
    let valid = await checkCategory(req.body).catch((err)=>{
        return {err:err}
    })
    if (!valid || (valid && valid.error)){
        return res.send ({error:valid.error})
    }
    let find = await Category.findOne({where:{cName:req.body.cName}}).catch((err)=>{
        return {error:err}
    })
    if(find || (find && find.error)){
        return res.send ({error:"category already exist"})
    }
    let data = await Category.create(req.body).catch((err)=>{
        return res.send({error:"failed to create category"})
    })
    return res.send({data})
})

//get all category

app.get('/category/all', async(req,res)=>{
    let data = await Category.findAll().catch((err)=>{
        return {error:err}
    })
    if(!data || (data && data.error)){
        return res.send({error:"unable to get all category"});
    }
    return res.send({data:data})
})


//create product joi validation
async function checkProduct(data){
    let schema = joi.object({
        name: joi.string().required(),
        price: joi.number().required(),
        description: joi.string().required(),
        categoryId: joi.string().required()
    })
    let valid = await schema.validateAsync(data).catch((err)=>{
        return {error:err}
    })
    if(!valid || (valid && valid.error)){
        let msg = []
        for(let i of valid.error.details){
            msg.push(i.message)
        }
        return {error:msg}
    }
    return {data:valid}
}

//product create

app.post('/product/add', async(req,res)=>{
    let valid = await checkProduct(req.body).catch((err)=>{
        return {error:err}
    })
    if(!valid || (valid && valid.error)){
        return res.send ({error: valid.error})
    }
    let productData = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        categoryId: req.body.categoryId,
        slug: req.body.name
    }
    let findProduct = await Product.findOne({where:{slug:productData.slug}}).catch((err)=>{
        return {error:err}
    })
    if(findProduct){
        productData.slug = findProduct.slug + '-' + 1
    }
    let data = await Product.create(productData).catch((err)=>{
        return {error:err}
    })
    if(!data || (data && data.error)){
        return res.send({error:"failed to create product"})
    }
    return res.send ({data:data})
})

// product getByHandle

app.get('/product/:getByHandle', async(req,res)=>{
    let data = await Product.findOne({where:{slug: req.params.getByHandle}}).catch((err)=>{
        return {error:err}
    })
    if(!data){
        return res.send ({error:"Product Not Found"})
    }
    return res.send ({data:data})
})

// product update joi validation

async function chechUpdate(data){
    let schema = joi.object({
        name: joi.string().required(),
        price: joi.number().required(),
        description: joi.string().required(),
        categoryId: joi.number().required()
    })
    let valid = await schema.validateAsync(data).catch((err)=>{
        return {error:err}
    })
    if(!valid || (valid && valid.error)){
        let msg = []
        for(let i of valid.error.details){
            msg.push(i.message)
        }
        return { error: msg}
    }
    return {data:valid}
}


 // product update

app.put('/product/update/:productId', async(req,res)=>{
    let valid = await chechUpdate(req.body).catch((err)=>{
        return {error:err}
    })
    if(!valid || (valid && valid.error)){
        return res.send({error: valid.error})
    }
    let find = await Product.findOne({where:{id:req.params.productId}}).catch((err)=>{
        return {error:err}
    })
    if(!find || (find && find.error)){
        return res.send({error:"product not exists"})
    }
    let data = await Product.update(req.body, {where:{id: req.params.productId}}).catch((err)=>{
        return {error:err}
    })
    if(!data || (data && data.error)){
        return res.send ({error:"failed to update product"})
    }
    return res.send ({data})
})

//product delete

app.delete('/product/delete/:id', async(req,res)=>{
    let find = await Product.findOne({where: {id: req.params.id}}).catch((err)=>{
        return {error:err}
    })
    let data = await Product.destroy({where:{id:find.id}}).catch((err)=>{
        return {error:err}
    })
    if(!data || (data && data.error)){
        return res.send ({error:"can not delete product"})
    }
    return res.send ({data: "product deleted"})
})

//get all products

app.get('/product', async(req,res)=>{
    let limit = (req.params.limit) ? parseInt(req.params.limit) : 10;
    let page = (req.params.page) ? parseInt(req.params.page) : 1;
    let offset = (page - 1)*limit
    let counter = await Product.count().catch((err)=>{
        return {error:err}
    })
    if(!counter || (counter && counter.error)){
        return res.send({error:"internal server error"})
    }
    if(counter<=0){
        return res.send({ error:"no products found"})
    }
    let pData = await Product.findAll({limit, offset, raw: true}).catch((err)=>{
        return {error:err}
    })
    if(!pData || (pData && pData.error)){
        return res.send({error: "internal server error"})
    }
    let query = `select product.id, product.name, product.price, product.description, product.slug, category.cname
                 from product
                 left join category
                 on product.categoryId=category.id`

    let join = await sequelizeCon.query(query, {type: QueryTypes.SELECT}).catch((err)=>{
        return {error:err}
    })
    return res.send({data:join, total:counter, page, limit})

})

//multiple product create


app.post('/product/addProduct', async(req,res)=>{
    let data = await Product.bulkCreate(req.body).catch((err)=>{
        return {error:err}
    })
    if(!data || (data && data.error)){
        return res.send({error:"unable to add"})
    }
    return res.send ({product:data})
})








app.listen(3005,()=>{
    console.log("Server Is Connected");
})