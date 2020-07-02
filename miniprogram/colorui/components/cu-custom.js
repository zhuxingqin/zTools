const app = getApp();
Component({
  /**
   * 组件的一些选项
   */
  options: {
    addGlobalClass: true,
    multipleSlots: true
  },
  /**
   * 组件的对外属性
   */
  properties: {
    bgColor: {
      type: String,
      default: ''
    },
    style:{
      type:String,
      default:''
    },
    isHome:{
      type: [Boolean, String],
      default: false
    },
    isCustom: {
      type: [Boolean, String],
      default: false
    },
    isBack: {
      type: [Boolean, String],
      default: false
    },
    bgImage: {
      type: String,
      default: ''
    },
    avatarUrl:{
      type: String,
      default: ''
    },
    modalName: {
      type: String,
      default: null,
    },
    loading:{
      type:Boolean,
      default:false
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    Custom: app.globalData.Custom
  },
  /**
   * 组件的方法列表
   */
  methods: {
    BackPage() {
      wx.navigateBack({
        delta: 1
      });
    },
    toHome(){
      wx.reLaunch({
        url: '/pages/index/index',
      })
    },
    showModal(){
      this.triggerEvent('showModal', { target: 'viewModal'});
    },
    hideModal(){
      this.triggerEvent('hideModal');
    },
  }
})