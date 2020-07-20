// miniprogram/pages/home/doneList/doneList.js
const app = getApp();
const global = getApp().globalData;
const db = wx.cloud.database();
const _ = db.command;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tltl:[],            //数据
    checkList:[],       //移除列表
    count:0,            
    loading:false,
    pageTitle:'已完成任务时间线'
  },
  changeCheck(e){
    var todoIndex = e.target.dataset.todoindex;
    var timeIndex = e.target.dataset.timeindex;
    let todo = this.data.tltl[timeIndex].todoList[todoIndex];
    let checkList = this.data.checkList;
    checkList.push(todo)
    let todoId = todo._id;
    var state =!todo.state;
    this.setData({
      ['tltl['+timeIndex+'].todoList['+todoIndex+'].state']:state,
      checkList
    })
    // db.collection('todo').doc(todoId).update({
    //   data:{
    //     state,
    //     finishTime:state?new Date().getTime():0,
    //   }
    // }).then(res=>{
    //   console.log('更改成功')
    // }).catch(err=>{
    //   console.error(err)
    // })
  },
  check(time){
    if (time < 10) {
      return '0' + time
    } else {
      return time
    }
  },
  getNoticeDateText(timeStamp,notice){
    let new_timeIndex = null;
    let noticeDateText = '';
    let noticeTimeText = '';
    var date = new Date(timeStamp);
    var y = date.getFullYear(); // 获取完整的年份(4位,1970)
    var m = this.check(date.getMonth() + 1); // 获取月份(0-11,0代表1月,用的时候记得加上1)
    var d = this.check(date.getDate()); // 获取日(1-31)
    noticeDateText = m + '月' + d + '日';
    if (notice){
      var time = new Date(timeStamp);
      var hours = this.check(time.getHours());
      var min = this.check(time.getMinutes());
      noticeTimeText =  hours + ':' + min; 
    }
    console.log(noticeDateText + ' '+noticeTimeText)
    return noticeDateText + ' '+noticeTimeText;
  },
  detaTextFun(timeStamp,notice){
    let todyStamp = this.getTime(0).timeStamp;
    let tomorrow = this.getTime(1).timeStamp;
    let dateText = '';
    if (timeStamp >= todyStamp && timeStamp < tomorrow) {//今天
      if (notice){
        var time = new Date(timeStamp);
        var hours = this.check(time.getHours());
        var min = this.check(time.getMinutes());
        return dateText =  hours + ':' + min; 
      }else{
        return dateText = '';
      }
    } else if (timeStamp < todyStamp || !timeStamp) {//随时
      if (!timeStamp) {
        return dateText = '';
      } else {
        return dateText = '逾期';
      }
    } else {//计划
      if (timeStamp >= tomorrow && timeStamp < tomorrow + 86400000) {
        return dateText = '明天';
      }else{
        var date = new Date(timeStamp);
        var y = date.getFullYear(); // 获取完整的年份(4位,1970)
        var m = this.check(date.getMonth() + 1); // 获取月份(0-11,0代表1月,用的时候记得加上1)
        var d = this.check(date.getDate()); // 获取日(1-31)
        return dateText = m + '月' + d + '日';
      }
    }
  },
  getTime(num) {
    var timeStamp = new Date(new Date().toLocaleDateString()).getTime() + num * 24 * 60 * 60 * 1000;
    var date = new Date(timeStamp);
    var y = date.getFullYear(); // 获取完整的年份(4位,1970)
    var m = this.check(date.getMonth() + 1); // 获取月份(0-11,0代表1月,用的时候记得加上1)
    var d = this.check(date.getDate()); // 获取日(1-31)
    return {
      timeStamp,
      time: y + '-' + m + '-' + d,
    }
  },
  getTimeText(timeStamp){
    var time = new Date(timeStamp);
    var hours = time.getHours();
    var min = this.check(time.getMinutes());
    var DON = '上午'
    if(hours >= 12){
      DON = '下午'
      hours-=12;
    }
    let timeText =hours+':'+min
    return {
      timeText,
      DON
    }
  },
  getDateText(timeStamp){
    // let onyDay = 86400000;
    let todyStamp = this.getTime(0).timeStamp;
    let tomorrow = this.getTime(1).timeStamp;
    let yesterday = this.getTime(-1).timeStamp;
    if (timeStamp >= todyStamp && timeStamp < tomorrow){//今天
      return "今天" 
    } else if (timeStamp >= yesterday && timeStamp < todyStamp ){
      return '昨天'
    } else{
      var date = new Date(timeStamp);
      var y = date.getFullYear(); // 获取完整的年份(4位,1970)
      var m = this.check(date.getMonth() + 1); // 获取月份(0-11,0代表1月,用的时候记得加上1)
      var d = this.check(date.getDate()); // 获取日(1-31)
      return m + '月' + d + '日';
    }
  },
  timeLine(list){
    let tltl = this.data.tltl;
    let workAreaArr=this.data.workAreaArr?this.data.workAreaArr:[];
    if(workAreaArr.length==0){
      app.workAreaList.map((workArea,index)=>{
        workAreaArr.push({
          wid:workArea._id,
          wname:workArea.name,
        })
      })
      this.setData({workAreaArr})
    }
    list.map((todo)=>{
      let timeObj=this.getTimeText(todo.finishTime);
      let dateText = this.getDateText(todo.finishTime);
      if(todo.time>0){
        todo.noticeDateText=this.getNoticeDateText(todo.time,todo.notice);
      }
      todo.timeText = timeObj.timeText;
      todo.dateText = this.detaTextFun(todo.time,todo.notice)
      todo.DON = timeObj.DON;
      for(var j=0;j<workAreaArr.length;j++){
        if(todo.wid == workAreaArr[j].wid ){
          todo.wname = workAreaArr[j].wname
          break;
        }
      }
      let i = tltl.length;
      if(tltl[0] && dateText == tltl[i-1].dateText){
        tltl[i-1].todoList.push(todo);
      }else{
        var obj = {
          dateText:'',
          todoList:[]
        }
        obj.dateText = dateText;
        obj.todoList.push(todo);
        tltl[i] = obj;
        i++;
      }
    })
    this.setData({tltl})
  },
  getTodoList(){
    this.setData({
      loading:true
    })
    let count = this.data.count;
    db.collection('todo').where({
      _openid: global.openid,
      state:true
    })
    .skip(count)
    .limit(20)
    .orderBy('finishTime', 'desc')
    .get()
    .then(res=>{
      this.timeLine(res.data)
      this.setData({
        todoList:res.data,
        count: count += 10,
        loading:false
      })
      console.log(res)
    })
    .catch(err=>{
      console.log('请求失败',err)
      this.setData({
        loading:false
      })
    })
  },
  onPageScroll(e){
    let scroll = e.scrollTop
    let style = 'color:rgba(66,65,66,1);'
    let num =1-(scroll/100);
    style="color:rgba(66,66,66,"+num+")";              
    this.setData({
      style
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getTodoList()
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
    let checkList = this.data.checkList;
    let timeInfo = app.timeInfo;
    let workAreaList = app.workAreaList;
    let getDetaType=(timeStamp)=>{
      let todyStamp = this.getTime(0).timeStamp;
      let tomorrow = this.getTime(1).timeStamp;
      if (timeStamp >= todyStamp && timeStamp < tomorrow){
        //今天
        return 0
      } else if (timeStamp == 0){
        //随时
        return 1
      }else{
        //计划
        return 2
      }
    }
    let timeSort =(arr)=>{//处理时间--冒泡排序
      var max
      for (var i = 0; i < arr.length; i++) {
        for (var j = i; j < arr.length; j++) {
          if (arr[i].createTime < arr[j].createTime) {
            max = arr[j]
            arr[j] = arr[i]
            arr[i] = max
          }
        }
      }
      return arr
    }
    checkList.map(todo=>{
      workAreaList.map((workItem,index) => {
        if (todo.wid == workItem._id){
          workItem.todoList.push(todo)
          workItem.todoList = timeSort(workItem.todoList)
          workItem.count+=1
        }
      })
      var timeIndex = getDetaType(todo.time);
      timeInfo[timeIndex].todoList.push(todo)
    })
    timeInfo.map((time)=>{
      time.todoList = timeSort(time.todoList)
    })
    
    app.timeInfo=timeInfo;
    app.workAreaList = workAreaList;
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
    if(this.data.loading){
      return
    }
    this.getTodoList()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})