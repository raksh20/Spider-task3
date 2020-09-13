module.exports=function Cart(oldCart){
	this.items=oldCart.items||{};
	this.totalQty=oldCart.totalQty||0;
	this.totalPrice=oldCart.totalPrice||0;

	this.add=function(item, id){
		var storeditem=this.items[id];
		if(!storeditem){
			storeditem=this.items[id]={item: item, qty:0, price:0};

		}
		storeditem.qty++;
		storeditem.price=storeditem.item.price*storeditem.qty;
		this.totalQty++;
		this.totalPrice+=storeditem.item.price;
	}
	

	this.generateArray=function(){
		var arr=[];
		for(var id in this.items){
			arr.push(this.items[id]);
		}
		return arr;
	};
};