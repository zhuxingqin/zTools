// pages/home/workArea/workArea.js
const app = getApp();
const global = getApp().globalData;
const db = wx.cloud.database();
const _ = db.command;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    wid: null,
    wname: null,
    loading:false,
    showAddBtn:true,
    toggleDelay:true,
    count:0,
    todoList: [],
    wnameInp:'',
    focus:false,
    updating:false,
  },
  importantChange(e){
    let todoIndex = e.detail.todoIndex;
    let todoItem = this.data.todoList[todoIndex];
    console.log('todoItem',todoItem)
    let important = todoItem.important?false:true;
    this.setData({
      ['todoList[' + todoIndex + "].important"]:important,
    })
    app.timeInfo.map((time ,index)=>{
      for(var i=0; i<time.todoList.length;i++){
        if(time.todoList[i]._id == todoItem._id){
          time.todoList[i].important = important
          app.timeInfo[index].todoList[i].important=important;
          return
        }
      }
    })
  },
  confrimUpdate(){
    this.setData({
      updating:false,
      wname:this.data.wnameInp
    })
    db.collection('workArea').doc(this.data.wid).update({
      data:{
        name:this.data.wnameInp
      }
    }).then((res)=>{
      console.log('区域名称修改成功',res)
      let workAreaList = app.workAreaList;
      let index = workAreaList.findIndex(item=>item._id==this.data.wid)
      app.workAreaList[index].name = this.data.wnameInp;
      if(app.initHomeData){
        app.initHomeData()
      }
    }).catch(res=>{
      console.log('区域名称修改失败',res)
    })
  },
  delAreaBefor(){
    if(this.data.confirm){
      this.setData({
        confirm:false
      })
      return
    }
    this.delArea()
  },
  wnameInp(e){
    console.log(e.detail)
    this.setData({
      wnameInp:e.detail.value
    })
  },
  updateWname(){
    if(this.data.wname=="日常"){
      wx.showToast({
        title: '该区域不给改名称😜',
        icon:'none'
      })
      return
    }
    this.setData({
      focus:true,
      updating:true,
    })
  },
  delArea(){
    let self = this;
    let workAreaList = app.workAreaList;
    let delArea=()=>{
      //删除分类
      db.collection('workArea').where({
        _openid: global.openid,
        _id:this.data.wid,
      }).remove().then((res)=>{
        console.log('删除workArea成功',res)
        let index = workAreaList.findIndex(item=>(
          this.data.wid==item._id
        ))
        //4.处理全局数据
        workAreaList.splice(index,1);
        app.workAreaList = workAreaList;
        app.initHomeData()
        wx.navigateBack({
          delta:1,
        })
      }).catch(res=>{
        console.log('删除失败',res)
      })
    }
    let delTodo =()=>{
      db.collection('todo').where({
        _openid: global.openid,
        wid:this.data.wid,
      }).remove().then((res)=>{
        console.log('删除todo成功',res)
        delArea()
      }).catch(res=>{
        console.log('删除失败',res)
      })
    }
    if(self.data.confirm){
      
      let workArea = workAreaList.find(item=>(
        this.data.wid==item._id
      ))
      console.log(workArea.count)
      //判断该分类是否还有todo
      if(workArea.count>0){//有
        //1.弹出提示
        wx.showModal({
          title:'⚠️警告',
          content:'此分类还有未完成的任务，如删除将会一同删除此分类中的所有任务！是否确定删除？',
          cancelColor: '#5D9CF6',
          confirmText:"删除",
          confirmColor:"#FA346E",
          success(res){
            if (res.confirm) {
              console.log('用户点击确定')
              //2.删除该分类所有的todo
              //3.删除该分类
              delTodo()
            } else if (res.cancel) {
              console.log('用户点击取消')
            }
          }
        })
      }else{//无
        //直接删除该分类
        delArea()
      }
    }
    this.setData({
      confirm:!self.data.confirm
    })
  },
  getTodoList(){
    let self = this;
    let todo = db.collection('todo');
    let count = self.data.count;
    this.setData({
      loading:true
    })
    todo.where({
      state: false,
      _openid: 'o9Eby5KEukzEHz5Sp-zlixWyJDms',
      wid: self.data.wid,
    }).count().then(res => { 
      let total = res.total;
      todo.where({
        state: false,
        _openid: 'o9Eby5KEukzEHz5Sp-zlixWyJDms',
        // _openid: app.globalData.openid,
        wid: self.data.wid,
      }).skip(count).limit(20).orderBy('createTime', 'desc').get({
        success(res) {
          let todoList = res.data;
          todoList.map(item => {
            item.dateText = self.getDateText(item.time, item.notice);
            item.partText = self.data.wname;
          })
          todoList = count ? self.data.todoList.concat(todoList) : todoList;
          self.setData({
            count: count += 20,
            todoList,
            total,
            loading: false
          },()=>{
            setTimeout(() => {
              self.setData({
                toggleDelay: false
              })
            }, 1000 + todoList.length * 100)
          })
        },
        fail(err) {
          console.error(err)
        }
      })
    })
  },
  getTime(num) {
    var check = time => {
      if (time < 10) {
        return '0' + time
      } else {
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
      time: y + '-' + m + '-' + d,
    }
  },
  /**
   * 获取中文日期
   */
  getDateText(timeStamp, notice) {
    var check = time => {
      if (time < 10) {
        return '0' + time
      } else {
        return time
      }
    }
    let todyStamp = this.getTime(0).timeStamp;
    let tomorrow = this.getTime(1).timeStamp;
    if (timeStamp >= todyStamp && timeStamp < tomorrow) {
      if (!notice) {
        return '今天'
      }
      var time = new Date(timeStamp);
      var hours = check(time.getHours());
      var min = check(time.getMinutes());
      return '今天 '+hours + ':' + min;
    } else if (timeStamp >= tomorrow && timeStamp < tomorrow + 86400000) {
      return '明天'
    } else if (timeStamp < todyStamp && timeStamp != 0) {
      return '逾期'
    } else if (timeStamp == 0) {
      return ''
    } else {
      var date = new Date(timeStamp);
      var y = date.getFullYear(); // 获取完整的年份(4位,1970)
      var m = check(date.getMonth() + 1); // 获取月份(0-11,0代表1月,用的时候记得加上1)
      var d = check(date.getDate()); // 获取日(1-31)
      return m + '月' + d + '日';
    }
  },
  /**
   * 查看todo详情
   */
  showDetail(e) {
    let todoIndex = e.detail.index;
    this.setData({
      ['todoList[' + todoIndex + '].show']: true,
      showAddBtn: false,
    })
  },
  changeCheckOut(e) {
    let self = this;
    let todoIndex = e.detail.todoIndex;
    let todoList = this.data.todoList;
    let todoId = todoList[todoIndex]._id;
    var state = todoList[todoIndex].state;
    var checkTimeout = setTimeout(() => {
      let todoList = this.data.todoList;
      let Index = null;
      todoList.map((todo, index) => {
        if (todoId == todo._id && todo.state) {
          Index = index;
        }
      })
      if (Index === null) {
        return
      }
      self.delHomedata({todoItem:todoList[todoIndex]})
      todoList.splice(Index, 1);
      this.setData({
        todoList,
      })
      const todo = db.collection('todo');
      todo.doc(todoId).update({
        data: {
          state: true,
          finishTime:new Date().getTime()
        }
      }).then(res => {
        console.log(res)
      }).catch(err => {
        console.error(err)
      })
    }, 3000)
    this.setData({
      ['todoList[' + todoIndex + '].state']: !state,
      checkTimeout,
    })
    /**
     * 处理数据修改之后的翻页问题
     */
  },
  delHomedata(data){
    let workAreaList = app.workAreaList;
    let timeInfo = app.timeInfo;
    let getWorkArea_Data = null;
    //处理分类数据
    workAreaList.map((workItem,index) => {
      for (var i = 0; i < workItem.todoList.length; i++) {
        if (workItem.todoList[i]._id == data.todoItem._id) {
          workItem.todoList.splice(i, 1)
          workItem.count -= 1;
          if(workItem.todoList.length<workItem.count){
            getWorkArea_Data={
              wid:workItem._id,
              workItemIndex:index
            }
          }
        }
      }
    })
    //处理时间区域数据
    for (var i = 0; i < timeInfo.length;i++){
      var find = false;
      for (var j = 0; j < timeInfo[i].todoList.length; j++) {
        if (timeInfo[i].todoList[j]._id == data.todoItem._id ){
          timeInfo[i].todoList.splice(j,1)
          app.timeInfo[i].todoList = timeInfo[i].todoList
          find = true;
          break
        }
      }
      if (find){
        break
      }
    }
    app.workAreaList = workAreaList;
    app.initHomeData(()=>{
      if(getWorkArea_Data){
        app.getWorkAreaList(getWorkArea_Data)
        getWorkArea_Data = null;
      }
    })
    /**
     * 处理修改数据后处理翻页问题
     */
  },
  del(data){
    console.log('data',data)
    let todoList = this.data.todoList;
    let todoId = data.todoItem._id;
    db.collection('todo').where({
      _id:todoId
    }).remove()
    .then(res=>{
      console.log('删除成功',res)
      //处理首页数据
      this.delHomedata({todoItem:data.todoItem})
      //处理当前页面数据
      todoList.splice(data.todoIndex,1)
      this.setData({
        todoList
      })
    }).catch(err=>{
      console.log(err)
      wx.showToast({
        title: '网络信号不好呢，等会再试一次吧。😭',
        icon:'none'
      })
    })
    
    /**
     * 处理修改数据后处理翻页问题
     */
  },
  unShowDetail(e) {
    let todoItem = e.detail.item;
    let todoIndex = e.detail.index;
    let timeStamp = todoItem.time;
    let todoList = this.data.todoList;
    let workAreaList = app.workAreaList;
    let timeInfo = app.timeInfo;
    let type = null;
    let doType = e.detail.type;
    let todyStamp = this.getTime(0).timeStamp;
    let tomorrow = this.getTime(1).timeStamp;
    let dateText = '';
    let getWorkArea_Data = null;
    var check = time => {
      if (time < 10) {
        return '0' + time
      } else {
        return time
      }
    }
    let verb = (arr)=> {
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
    if(doType=='del'){
      this.del({todoItem,todoIndex})
      return
    }
    if (todoItem.state) {
      this.delHomedata({todoItem})
      todoList.splice(todoIndex,1)
      this.setData({
        todoList
      })
      return
    }
    if (timeStamp >= todyStamp && timeStamp < tomorrow){ //今天
      if (todoItem.notice) {
        var time = new Date(timeStamp);
        var hours = check(time.getHours());
        var min = check(time.getMinutes());
        dateText ='今天 '+ hours + ':' + min;
      } else {              
        dateText = '今天';      
      }                     
      type = '今天';                                  
    } else if (timeStamp < todyStamp || !timeStamp) {    //随时
      if (!timeStamp) {       
        dateText = '';
      } else {
        dateText = '逾期';
      }
      type = '随时';
    } else {                                              //计划
      if (timeStamp >= tomorrow && timeStamp < tomorrow + 86400000) {
        dateText = '明天';
      } else {
        var date = new Date(timeStamp);
        var y = date.getFullYear(); // 获取完整的年份(4位,1970)
        var m = check(date.getMonth() + 1); // 获取月份(0-11,0代表1月,用的时候记得加上1)
        var d = check(date.getDate()); // 获取日(1-31)
        dateText = m + '月' + d + '日';
      }
      type = '计划';
    }
    todoItem.show = false;
    todoItem.dateText = dateText;
    timeInfo.map((timeObj)=>{
      if (type == timeObj.name) {
        if(timeObj.todoList.length==0){//没有数据,直接添加
          timeObj.todoList.push(todoItem)
        }else{
          // 找到旧数据，在原区域旧直接替换
          for (var i = 0; i < timeObj.todoList.length; i++) {
            if (timeObj.todoList[i]._id == todoItem._id) {
              timeObj.todoList.splice(i, 1, todoItem)//替换旧todo
              break
            } else if (i + 1 == timeObj.todoList.length) {
              //循环结束，未发现旧数据
              //在其他区域找到就 按时间排序，取前n个
              let length=timeObj.todoList.length;
              timeObj.todoList.push(todoItem);
              timeObj.todoList = verb(timeObj.todoList);
              var num = length/10>1? parseInt(length/10) :10;
              timeObj.todoList = timeObj.todoList.slice(0,num);
              break
            }
          }
        }
      } else {
        //删除其他区域的旧数据
        for (var i = 0; i < timeObj.todoList.length; i++) {
          if (timeObj.todoList[i]._id == todoItem._id) {
            timeObj.todoList.splice(i, 1);
          }
        }
      }
      console.log('timeObj', timeObj)
    })
    workAreaList.map((workItem,index) => {
      if (todoItem.wid == workItem._id) {
        if (workItem.todoList.length==0){//没有数据,直接添加
          workItem.todoList.push(todoItem)
          workItem.count +=1;
        }else{
        // 找到旧数据，在原区域旧直接替换
          for (var i = 0; i < workItem.todoList.length; i++) {
            if (workItem.todoList[i]._id == todoItem._id) {
              workItem.todoList.splice(i, 1, todoItem)//替换旧todo
              break
            } else if (i + 1 == workItem.todoList.length) {
              //循环结束，未发现旧数据
                //在其他区域找到就 按时间排序，取前四个
              workItem.todoList.push(todoItem)
              workItem.todoList = verb(workItem.todoList);
              workItem.todoList = workItem.todoList.slice(0, 4);
              workItem.count +=1;
              break
            }
          }
        }
      } else {
        //删除其他区域的旧数据
        for (var i = 0; i < workItem.todoList.length; i++) {
          if (workItem.todoList[i]._id == todoItem._id) {
            workItem.todoList.splice(i, 1);
            workItem.count -= 1;
            if(workItem.todoList.length<workItem.count){
              getWorkArea_Data={
                wid:workItem._id,
                workItemIndex:index
              }
            }
          }
        }
      }
    })
    app.timeInfo = timeInfo;
    app.workAreaList = workAreaList;
    app.initHomeData(()=>{
      if(getWorkArea_Data){
        app.getWorkAreaList(getWorkArea_Data)
        getWorkArea_Data = null;
      }
    })
    this.setData({
      ['todoList[' + todoIndex + ']']: todoItem,
      showAddBtn: true,
    }, () => {
      let todoList = this.data.todoList;
      setTimeout(()=>{
        if (todoItem.wid != this.data.wid) {
          todoList.splice(todoIndex, 1);
        } else {
          todoList = verb(todoList)
        }
        this.setData({
          todoList
        })
      },500)
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      wid:options.wid,
      wname: options.wname,
      wnameInp: options.wname,
    },()=>{
      this.getTodoList()
      // app.getDailyId({
      //   wid:options.wid,
      //   wname:options.wname
      // })
    })
    app.initWorkareaPageData = ()=>{
      this.setData({
        count:0
      },()=>{
        this.getTodoList()
      })
    }
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
    if (!this.data.loading && this.data.count < this.data.total) {
      this.getTodoList()
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})