const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
var that = null;
Page({
  data: {
    text: '',
    photo: []
  },
  onLoad(options) {
    that = this;
  },
  gettext(e) {
    that.setData({
      text: e.detail.value
    })
  },
  chooseimage() {
    wx.chooseImage({
      count: 9 - that.data.photo.length,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        //选择完成后，把图片列表追加到已有的列表中
        console.log('res.tempFilePaths:', res.tempFilePaths)

        that.setData({
          photo: that.data.photo.concat(res.tempFilePaths)
        })
      }
    })
  },
  
  previewimg(e) {
    // 预览图片
    wx.previewImage({
      urls: that.data.photo,
      current: e.currentTarget.dataset.url
    })
  },
  removeimg(e) {
    //长按删除图片
    wx.showModal({
      content: '是否要删除该图片',
      success(res) {
        if (res.confirm) {
          let url = e.currentTarget.dataset.url;
          let urls = that.data.photo;
          urls.splice(urls.indexOf(url), 1);
          that.setData({
            photo: urls
          })
        }
      }
    })
  },
  done(e){
    //开始执行上传
    console.log(e.detail.userInfo)
    if(e.detail.userInfo){
      that.authorname = e.detail.userInfo.nickName;
      that.authorimg = e.detail.userInfo.avatarUrl;
      if(that.data.text.length>=1){
        wx.showLoading({
          title: '文字检查中',
          mask: true
        })
        // 1. 调用 textsec函数 实现文字校验
        // 2. 校验通过后调用 uploadimg函数 实现图片上传
        wx.cloud.callFunction({
          name:'textsec',//云函数名称
          data:{
            text:that.data.text//检测文字
          },
          success(){//文字安全
            //文字通过后，开始执行图片上传队列
            that.uploadimg(that.data.photo);
          },
          fail(e){//文字不安全
            console.log('e:', e)
            wx.hideLoading();
            wx.showModal({
              title:'提示',
              content:'你发表的帖子中有不安全内容，请修整后重试',
              showCancel:false
            })
          }
        })
      }
      else{
        wx.showModal({
          title:'提示',
          content:'请和花友说点什么再上传',
          showCancel:false
        })
      }
    }
    else{
      wx.showModal({
        title:'提示',
        content:'为了实名安全考虑，你需要授权信息才可以发表帖子',
        showCancel:false
      })
    }
  },
  async uploadimg(imgs){
    //帖子图片上传
    let result = [];
    for(let item of imgs){
      wx.showLoading({
        title: '图片上传中',
        mask: true
      })
      let files = await wx.cloud.uploadFile({
        cloudPath: `hole/${Date.now()}-${Math.floor(Math.random(0,1)*1000)}.png`,
        filePath: item
      });
      console.log('files:', files)
      wx.showLoading({
        title: '检测安全中',
        mask: true
      })
      let secres = await that.imagesec(files.fileID);
      console.log('secres:', secres)
      if(secres)
        result.push(files);
    }

    console.log('uploadimg res:', result)
    that.additem(result);
    //TODO 帖子图片上传
  },
  imagesec(fileID){
    //TODO 图片安全检查
    return new Promise((resolve, reject)=>{
      // 1. 调用imagesec 云函数 ，实现图片安全的校验
      // 2. 若校验失败，删除该文件
      wxx.cloud.callFunction({
        name:'imagesec',
        data:{
          img:fileID
        },
        success(res){
          resolve(true);
        },
        fail(e){
          console.log('e:', e)
          wx.cloud.deleteFile({
            fileList: [fileID]
          });
          resolve(false);
        }
      });
    })
    //TODO 图片安全检验
  },
  additem(photos) {
    //TODO 新建帖子
    const albumPhotos = photos.map(photo => photo.fileID);
    console.log('albumPhotos', albumPhotos)

    // 1. 向forum集合中添加帖子数据，数据结构如下 
    /**
     * {
     *  content // 帖子文字内容
     *  image // 帖子中图片
     *  date // 当前时间
     *  authorname // 作者名
     *  authorimg // 作者头像
     * }
     */
    db.collection('forum').add({
      data: {
        content:that.data.text,
        image:albumPhotos,
        data:new Date(),
        authorname:that.authorname,
        authorimg:that.authorimg
      }
    }).then(result => {
      console.log('result:', result)
      wx.hideLoading();
      wx.navigateBack({
        delta: 1
      })
    }).catch(err=>{
      wx.hideLoading();
    })
  },
})