//app.js
let db = null;
let _ = null;
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        traceUser: true,
      })
      db = wx.cloud.database();
      _ = db.command;

    }
    /**
     * 获取设备信息
     */
    wx.getSystemInfo({
      success: e => {
        this.globalData.StatusBar = e.statusBarHeight;
        let custom = wx.getMenuButtonBoundingClientRect();
        this.globalData.Custom = custom;
        this.globalData.CustomBar = custom.bottom + custom.top - e.statusBarHeight;
      }
    })
    // 获取用户信息
    wx.getSetting({//检查是否已有授权
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo;
              //获取openid
              this.onGetOpenid()
            }
          })
        }
      }
    })
  },
  /**
   * 选中tabbar
   */
  selectedTabBar(index,that){
    if (typeof that.getTabBar === 'function' &&
      that.getTabBar()) {
        console.log(index)
      that.getTabBar().setData({
        selected: index
      })
    }
  },
  /**
   * 获取openid
   */
  onGetOpenid(type) {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        this.globalData.openid = res.result.openid
        if (this.loginCallback) {
          this.loginCallback(this.globalData.userInfo)
        }
        if (type == 'new') {
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
  onCheckUser() {
    // 查询当前用户所有的 counters
    console.log('in')
    db.collection('userInfo').where({
      _openid: this.globalData.openid
    }).count({
      success: res => {
        console.log('[数据库] [查询记录] 成功: ', res)
        if (res.total == 0) {
          //添加用户
          this.onAddUser()
        } else {
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
  onAddUser () {
    db.collection('userInfo').add({
      data: {
        // userId: _.inc(1),
        createTime: new Date().getTime(),
        nickName: this.globalData.userInfo.nickName,
        avatarUrl: this.globalData.userInfo.avatarUrl,
      },
      success: res => {
        // 在返回结果中会包含新创建的记录的 _id
        console.log(res)
        wx.showToast({
          title: '登录成功',
          icon: 'none'
        })
        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
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
  globalData:{ 
    userInfo:null
  }
})
