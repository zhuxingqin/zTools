// component/timePicker/timePicker.js
const app = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    timeObj:{
      type: Object,
      value: {
        dateText:null,
        noticeTime: null,
        noticeText: null,
        formId:null,
        time:null,
      }
    }
  },
  options: {
    addGlobalClass: true,
  },
  /**
   * 组件的初始数据
   */
  data: {
    CustomBar: app.globalData.CustomBar,
    tody:false,
    tomorrow:null
  },

  /**
   * 组件的方法列表
   */
  methods: {
    close() {
      this.triggerEvent('close')
    },
    getTime(num) {
      var check = time => {
        if (time < 10) {
          return '0' + time
        }else{
          return time
        }
      }
      var timeStamp = new Date(new Date().toLocaleDateString()).getTime() + num * 24 * 60 * 60 * 1000;
      var date = new Date(timeStamp);
      var y = date.getFullYear(); // 获取完整的年份(4位,1970)
      var m = check(date.getMonth() + 1); // 获取月份(0-11,0代表1月,用的时候记得加上1)
      var d = check(date.getDate()); // 获取日(1-31)
      return {
        timeStamp,
        time: y + '-' + m + '-' + d
      } 
    },
    chooseTody(){
      this.setData({
        "timeObj.time": this.getTime(0).timeStamp,
        "timeObj.dateText": '今天',
      })
    },
    dateChange(e){
      var date = e.detail.value;
      let olddata = date.replace(/-/g, '/');
      var timeStamp = new Date(olddata).getTime();
      this.setData({
        "timeObj.time": timeStamp,
        "timeObj.dateText": date,
        tody:false,
      })
    },
    timeChange(e){
      var t = e.detail.value;
      var arr = t.split(':');
      var timeStamp = parseInt(arr[0]) * 60 * 60 * 1000;
      timeStamp += parseInt(arr[1]) * 60 * 1000;
      console.log(timeStamp);
      this.setData({
        'timeObj.noticeTime': timeStamp,
        "timeObj.noticeText": t,
      })
      if(!this.data.timeObj.dateText){
        this.chooseTody()
      }
    },
    cleanNotice(){
      this.setData({
        'timeObj.noticeTime':null,
        "timeObj.noticeText": null,
      })
    },
    clearAll(){
      this.setData({
        "timeObj.time": null,
        'timeObj.noticeTime':null,
        "timeObj.noticeText":null,
        "timeObj.formId":null,
        "timeObj.dateText": null,
      })
      this.triggerEvent('choose',this.data.timeObj)
      this.triggerEvent('close')
    },
    //获取通知授权
    requestSubscribeMessage(callback){
      if(!this.data.timeObj.noticeText){
        callback(true)
        return
      }
      let tmplIds = app.tmplIds;
      console.log('tmplIds',app.tmplIds)
      wx.requestSubscribeMessage({
        tmplIds:[tmplIds],
        success(res){
          console.log('获取成功',res)
          if(res[tmplIds]=="reject"){
            console.log('用户拒绝通知授权')
            wx.showToast({
              title: '为了正常使用任务提醒功能，您需要允许授权哦～😅',
              icon:'none',
              duration:3000,
              mask:true
            })
            callback(false)
          }else if(res[tmplIds]=='accept'){
            console.log('用户已授权')
            callback(true)
          }else{
            callback(false)
            wx.showToast({
              title: '哎呀，提醒功能暂时无法使用呢～',
              icon:'none',
              duration:3000,
            })
            //清除通知时间
            console.log('通知授权已被后台封禁')
          }
        },
        fail(err){
          callback(false)
        },
        complete(e){
          console.log('获取结束',e)
        }
      })
      return
    },
    /**
     * 完成
     */
    done(e){
      this.requestSubscribeMessage((Boolean)=>{
        if(Boolean){//完成授权
          var timeObj = {
            time: this.data.timeObj.time,
            noticeTime: this.data.timeObj.noticeTime,
            noticeText: this.data.timeObj.noticeText,
            dateText: this.data.timeObj.dateText,
            // dateText: this.data.tody ? "今天" : this.data.timeObj.dateText,
            // formId: formId,
          }
          if (this.data.timeObj.dateText){
            this.triggerEvent('choose', timeObj)
          }
          this.triggerEvent('close')
        }else{//授权失败
          return
        }
      })
    }
  },
  attached() {
    let tomorrow = this.getTime(1).time;
    this.setData({
      'timeObj.time': this.data.timeObj.time ? this.data.timeObj.time : this.getTime(0).timeStamp,
      tomorrow,
    })
  }
})