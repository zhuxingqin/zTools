// component/addWorkArea/addWorkArea.js
const app = getApp();
const global = getApp().globalData;
const db = wx.cloud.database();
const _ = db.command;
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show:{
      type:Boolean,
      default:false
    }
  },
  options:{
    addGlobalClass:true
  },
  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    addPartConfirm(){
      let wname =this.data.wname+'';
      wname = wname.trim();
			if(!wname || wname=='undefined'){
				wx.showToast({
					title: '请输入区域名称',
          icon:'none',
				})
				return
      }
      let haveSameItem = app.workAreaList.find(item=>item.name == wname)
			if(haveSameItem){
				wx.showToast({
					title: '已存在该区域',
					icon:'none'
				})
				return
      }
      let sort = app.workAreaList[0].sort +1;
      db.collection('workArea').add({
        data: { 
          name:wname,
          sort,
        },
        success: res => {
          this.setData({
            wname:''
          })
          app.workAreaList.unshift({
            count: 0	,
            name: wname,
            sort,
            todoList: [],
            _id: res._id,
            _openid: global.openid,
          })
          app.initHomeData()
        },
        fail: err => {
          wx.showToast({
            icon: 'none',
            title: '网络信号不好呢，等会再试一次吧。😭'
          })
        }
      })
      this.close()
    },
    partNameInp(e){
      this.setData({
        wname:e.detail.value
      })
    },
    close(){
      this.triggerEvent('close')
    },
  }
})
