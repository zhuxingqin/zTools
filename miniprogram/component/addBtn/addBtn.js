// component/addBtn/addBtn.js
const app = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    showAddBtn:{
      type:Boolean,
      value:true
    },
    isHome:{
      type:Boolean,
      value:true
    }
  },
  options:{
    addGlobalClass: true,
  },

  /**
   * 组件的初始数据
   */
  data: {
    adding:false,
    addTodo:false,
    addWorkArea:false,
    check:false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    addTodo(){
      var page = getCurrentPages();
      this.setData({
        wid:page.length>1?page[1].options.wid:app.globalData.dailyId,
        wname:page.length>1?page[1].options.wname:'日常'
      })
      console.log(app.globalData.dailyId)
      this.setData({
        addTodo: true,
        adding: false,
        showAddBtn:false,
      })
    },
    addWorkArea(){
      if (app.workAreaListCount>=20){
        wx.showToast({
          title: '最多添加20个负责区域',
          icon:'none'
        })
        return
      }
      this.setData({
        addWorkArea: true,
        adding: false,
        showAddBtn:false
      })
    },
    closePopup(e){
      this.setData({
        addTodo:false,
        showAddBtn: true
      })
    },
    changeCheck(){
      this.setData({
        check:!this.data.check
      })
    },
    addWin() {
      if(!this.data.adding){
        wx.vibrateShort()
      }
      if (!app.globalData.userInfo){
        wx.showToast({
          title: '请先登陆😳',
          icon:'none'
        })
        return
      }
      if (this.data.isHome){
        this.setData({
          adding: !this.data.adding
        })
      }else{
        this.addTodo()
      }
      
    },
    addPart(){
      if (app.workAreaListCount>=20){
        wx.showToast({
          title: '最多添加20个负责区域',
          icon:'none'
        })
        return
      }
      this.addWin();
      this.triggerEvent('addPart');
    },
  }
})
