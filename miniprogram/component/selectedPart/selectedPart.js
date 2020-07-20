// component/selectedPart/slectedPart.js
const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
const database = require('../../database/database.js');
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show:{
      type:Boolean,
      value:false
    },
    wid: {
      type: String,
      value: null
    },
  },
  options:{
    addGlobalClass: true,
  },

  /**
   * 组件的初始数据
   */
  data: {
    partList:[],
    showAddWorkArea:false
  },
  /**
   * 组件的方法列表
   */
  methods: {
    closeAddWorkArea(){
      this.setData({
        showAddWorkArea: false,
      })
    },
    close(){
      this.setData({
        wnameInp:'',
        showAddWorkArea:false
      })
      this.triggerEvent('close')
    },
    choose(e){
      const item=e.currentTarget.dataset.item;
      this.triggerEvent('choose',item)
      this.setData({
        wid: item._id
      },()=>{
        this.close()
      })
    },
    bindinput(e){
      this.setData({
        wnameInp:e.detail.value
      })
    },
    addPartConfirm(){
      if(!this.data.showAddWorkArea){
        this.setData({
          showAddWorkArea: true,
        })
        return
      }
      let wname =this.data.wnameInp+'';
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
					title: '已存在该区域😒',
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
            wnameInp:'',
            showAddWorkArea:false
          })
          app.workAreaList.unshift({
            count: 0,
            name: wname,
            sort,
            todoList: [],
            _id: res._id,
            _openid: global.openid,
          })
          app.initHomeData()
          this.getWorkArea()
        },
        fail: err => {
          wx.showToast({
            icon: 'none',
            title: '网络信号不好呢，等会再试一次吧。😭'
          })
        }
      })
    },
    getWorkArea(){
      console.log('in')
      database.getWorkArea().then(res=>{
        this.setData({
          partList:res,
        })
      })
    },
  },
  /**
   * 数据监听器
   */
  observers: {
    'show'(show) {
      if (show && this.data.partList.length==0){
        this.getWorkArea()
      }
    }
  },
})
