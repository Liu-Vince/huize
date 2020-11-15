const app = getApp();
const db = wx.cloud.database()
const _ = db.command;
var that = null;
Page({
  onLoad(){
    that = this;
  },
  onShow(){
    wx.showNavigationBarLoading()
    that.init();
    // that.toadmin();
  },
  toAdd(){
    // 此处需跳转至发帖页面 （待实现）
    wx.navigateTo({
      url: '../add/add', 
    })
  },
  todetail(e){
    app.globalData.item=e.currentTarget.dataset.item;
    wx.navigateTo({
      url: '../detail/detail',
    })
  },
  init(){
    //1. 从 forum 集合中查询所有文档 
    //2. 对查询的每一条文档，调用app.nowdate方法，对文档中的date字段进行转换，并setData更新  items字段
    db.collection('forum').get()
    .then(result => {
      console.log(result);
      let items = result.data.map(item =>{
        item.data = app.nowdate(item.data);
        return item;
      })
      that.serData({
        items:items
      })
      wx.hideLoading();
      wx.hideNavigationBarLoading();
    })
  }
})