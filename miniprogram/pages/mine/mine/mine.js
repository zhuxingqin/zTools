// miniprogram/pages/mine/mine/mine.js
const app = getApp();
const global = getApp().globalData;
const db = wx.cloud.database();
const _ = db.command;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    navHeight: global.Custom.top,
    CustomBar: global.Custom.bottom,
  },
  /**
   * 获取用户信息
   */
  onGetUserInfo: function (e) {//成功获取授权
    if(app.globalData.userInfo!=null)return
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        nickName: e.detail.userInfo.nickName,
        userInfo: e.detail.userInfo
      })
      app.globalData.userInfo = e.detail.userInfo;
      //获取openid
      this.onGetOpenid('new')
    }
  },
  /**
   * 获取openid
   */
  onGetOpenid: function (type) {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        if(type=='new'){
          this.onCheckUser()
        }
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
      }
    })
  },
  /**
   * 检查用户是否已存在
   */
  onCheckUser(){ 
    // 查询当前用户所有的 counters
    db.collection('userInfo').where({
      _openid: app.globalData.openid
    }).count({ 
      success: res => {
        console.log('[数据库] [查询记录] 成功: ', res)
        if (res.total==0){
          //添加用户
          this.onAddUser()
        }else{
          console.log('用户已存在')
        }
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })
  },
  /**
   * 新增用户
   */
  onAddUser: function () {  
    db.collection('userInfo').add({
      data: {
        // userId: _.inc(1),
        createTime: new Date().getTime(),
        nickName: app.globalData.userInfo.nickName,
        avatarUrl: app.globalData.userInfo.avatarUrl,
      },
      success: res => {
        // 在返回结果中会包含新创建的记录的 _id
        console.log(res)
        wx.showToast({
          title: '登录成功',
          icon:'none'
        })
        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
        db.collection('userInfo').doc(res._id).update({
          data:{
            userId:_.inc(1),
          },
          success:(res)=>{
            console.log(res)
          },
          fail:(err)=>{
            console.log(err)
          }
        })
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '新增记录失败'
        })
        console.error('[数据库] [新增记录] 失败：', err)
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取用户信息
    wx.getSetting({//检查是否已有授权
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                nickName: res.userInfo.nickName,
                userInfo: res.userInfo
              })
              app.globalData.userInfo = res.userInfo;
              //获取openid
              this.onGetOpenid()
            }
          })
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    app.selectedTabBar(1,this)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  }
})