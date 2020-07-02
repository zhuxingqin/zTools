const app = getApp();
const global = getApp().globalData;
const db = wx.cloud.database();
const _ = db.command;
Page({
  data: {
    userInfo: global.userInfo,
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    Custom: app.globalData.Custom, 
    hasUserInfo: false,
    // canIUse: wx.canIUse('button.open-type.getUserInfo'),
    TabCur: 1,
    scrollLeft: 0,
    workAreaList:[],
    todyCount:0,
    anytimeCount:0,
    somedayCount:0,
    noteObj:{
      note:'测试测试',
      showColor:'FFE654',
      realColor:'FFF7CC',
      _id:'',
      createTime:'',
      important:true,
    },
    elements:[{
      title: '计算机',
      name: 'calculator',
      color: 'olive',
      icon: 'icon'
    },{
      title: '便利贴',
      name: 'memorandum',
      color: 'orange',
      icon: 'copy'
    }],
    timeInfo:[{
      name:'今天',
      toggleDelay:true,
      show:false,
      todoList:[]
    },{
      name: '随时',
      toggleDelay: true,
      show: false,
      todoList: []
    },{
      name: '计划',
      toggleDelay: true,
      show: false,
      todoList: []
    }],
    addPart:false,
    partName:'',
    checkTimeout:null,
    showAddBtn:true,
    size: 4,
    isIphoneX:true,
    scrollTop:0,
    showAddWorkArea:false,
  },
  notechange(e){
    let item = e.detail.item;
    this.setData({
      noteObj:item
    })
  },
  jumpToUpdatePage(){
    wx.navigateTo({
      url: '/pages/home/log/log',
    })
  },
  jumpAbout(){
    wx.showToast({
      title: '没想好怎么写😂',
      icon:"none"
    })
  },
  addWorkArea(){
    this.setData({
      showAddWorkArea: true,
    })
  },
  closeAddWorkArea(){
    this.setData({
      showAddWorkArea: false,
    })
  },
  donePageBtn(){
    wx.navigateTo({
      url: '../doneList/doneList',
    })
  },
  toggle() {
    var that = this;
    that.setData({
      animation: true
    })
    setTimeout(function () {
      that.setData({
        animation: false
      })
    }, 1000)
  },
  onGetUserInfo: function (e) {//成功获取授权
    if (app.globalData.userInfo) return
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        nickName: e.detail.userInfo.nickName,
        userInfo: e.detail.userInfo,
        modalName:null
      },()=>{
        app.globalData.userInfo = e.detail.userInfo;
        //获取openid
        app.onGetOpenid()
      })
    }
  },
  getTodo(callback){
    let self=this;
    let todo = db.collection('todo');
    let wList = self.data.workAreaList;
    var promise = Promise.all(wList.map(item=>{
      return new Promise((resolve, reject)=>{
        todo.where({
          state: false,
          _openid: app.globalData.openid,
          wid:item._id,
        }).skip(0).limit(4).orderBy('createTime', 'desc').get({
          success(res) {
            let todoList = res.data;
            item.todoList = res.data;
            resolve(item)
          },
          fail(err){
            reject()
            console.error(err)
          } 
        })
      })
    }))
    promise.then(wList=>{
      app.workAreaList = wList;
      this.setData({ workAreaList: app.workAreaList })
      if(callback){
        callback()
      }
    }).catch(err=>{
      if(app.loading){
        app.loading(false)
      }
      console.error(err)
    })
  },
  getUserInfo: function (e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  showModal(e) {
    this.setData({
      modalName: e.currentTarget.dataset.target || e.detail.target
    })
  },
  hideModal(e) {
    this.setData({
      modalName: null
    })
  },
  tabSelect(e) {
    this.setData({
      TabCur: e.currentTarget.dataset.id,
      scrollLeft: (e.currentTarget.dataset.id - 1) * 60
    })
  },
  /**
   * 获取分类
   */
  getWorkArea(callback){
    if (!callback) { callback=()=>{}}
    const workArea = db.collection('workArea');
    workArea.where({
      _openid: app.globalData.openid,
    }).orderBy('sort','desc').get({
      success: res => {
        app.workAreaList = res.data
        app.workAreaListCount = res.data.length;
        this.setData({
          workAreaList: app.workAreaList,
        },()=>{
          this.getWorkAreaNumber(app.workAreaList)
        })
        callback(res.data)
        this.getDailyId(res.data)
      },
      fail: err => {
        console.error('查询记录失败')
      }
    })
  },
  getWorkAreaNumber(workAreaList){
    let self = this;
    let p = Promise.all(workAreaList.map((item,index)=>{
      return new Promise((resolve,reject)=>{
        db.collection('todo')
        .where({
          _openid: global.openid,
          wid:item._id,
          state:false
        })
        .count()
        .then((res)=>{
          item.count=res.total;
          app.workAreaList[index].count=res.total;
          resolve(item)
        })
        .catch((err)=>{
          console.log(err)
          reject()
        })
      })
    }))
    p.then((res)=>{
      this.setData({
        workAreaList:res
      })
    }).catch((err)=>{
      wx.showToast({
        title: '哎呀，网络断了～',
        icon:'none'
      })
      if(app.loading){
        app.loading(false)
      }
      console.log('获取分类数量失败',err)
    })
    
  },
  /**
   * 保存日常区域id到全局
   */
  getDailyId(workAreaList){
    workAreaList.map(item=>{
      if(item.name == '日常'){
        app.globalData.dailyId=item._id;
      }
    })
  },
  /**
   * 获取今天任务列表
   */
  getToday(callback){
    if (!callback) { callback = () => {}}
    const todo = db.collection('todo');
    let todyStamp = this.getTime(0).timeStamp;
    let tomorrow = this.getTime(1).timeStamp;
    let self=this;
    let todyCount = this.data.timeInfo[0].todoList.length;
    todo.where({
      _openid: app.globalData.openid,
      state: false,
      time: _.and(_.gte(todyStamp), _.lt(tomorrow))
    }).count().then(res=>{
      let total = res.total;
      todo.where({
        _openid: app.globalData.openid,
        state: false,
        time: _.and(_.gte(todyStamp), _.lt(tomorrow))
      }).skip(todyCount).limit(10).orderBy('createTime', 'desc').get({
        success(res) {
          callback()
          let todoList = res.data;
          todoList.map(item => {
            item.dateText = self.getDateText(item.time,item.notice);
            let workAreaList = self.data.workAreaList;
            workAreaList.map(part=>{
              if(part._id == item.wid){
                item.partText = part.name
              }
            })
          })
          let item = self.data.timeInfo[0];
          item.todoList = todyCount ? item.todoList.concat(todoList) : todoList;
          item.more = item.todoList.length >= total ? false : true;
          app.timeInfo[0] = item,
          self.setData({
            ['timeInfo[' + 0 + ']']: item,
            todyCount: todyCount += 10,
          }, () => {
            setTimeout(() => {
              app.timeInfo[0].toggleDelay=false;
              self.setData({
                ['timeInfo[' + 0 + '].toggleDelay']: false
              })
            }, 1000 + item.todoList.length*100)
          })
        },
        fail(err) {
          wx.showToast({
            title: '哎呀，网络断了～',
            icon:'none'
          })
          console.error(err)
        }
      })
    })
  },
  /**ƒ
   * 获取计划任务列表
   */
  getSomeDay(callback){
    if (!callback) { callback = () => { } }
    const todo = db.collection('todo');
    let tomorrow = this.getTime(1).timeStamp;
    let somedayCount = this.data.timeInfo[2].todoList.length;
    let self = this;
    todo.where({
      _openid: app.globalData.openid,
      state: false,
      time: _.nor(_.eq(0), _.lt(tomorrow))
    }).count().then(res => {
      let total = res.total;
      todo.where({
        _openid: app.globalData.openid,
        state: false,
        time: _.nor(_.eq(0), _.lt(tomorrow))
      }).skip(somedayCount).limit(10).orderBy('createTime', 'desc').get({
        success(res) {
          callback()
          let todoList = res.data;
          todoList.map(item => {
            item.dateText = self.getDateText(item.time, item.notice);
            let workAreaList = self.data.workAreaList;
            workAreaList.map(part => {
              if (part._id == item.wid) {
                item.partText = part.name
              }
            })
          })
          let item = self.data.timeInfo[2];
          item.todoList = somedayCount ? item.todoList.concat(todoList) : todoList;
          item.more = item.todoList.length >= total ? false : true;
          app.timeInfo[2] = item;
          self.setData({
            ['timeInfo[' + 2 + ']']: item,
            somedayCount: somedayCount += 10,
          }, () => {
            setTimeout(() => {
              app.timeInfo[2].toggleDelay=false;
              self.setData({
                ['timeInfo[' + 2 + '].toggleDelay']: false
              })
            }, 1000 +item.todoList.length * 100)
          })
        },
        fail(err) {
          wx.showToast({
            title: '哎呀，网络断了～',
            icon:'none'
          })
          console.error(err)
        }
      })
    })
  },
  /**
   * 获取随时任务列表
   */
  getAnyTime(callback) {
    if (!callback) { callback = () => { }}
    const todo = db.collection('todo');
    let todyStamp = this.getTime(0).timeStamp;
    let anytimeCount = this.data.timeInfo[1].todoList.length;
    let self = this;
    todo.where({
      _openid: app.globalData.openid,
      state: false,
      time: _.lt(todyStamp)
    }).count().then(res => {
      let total = res.total;
      todo.where({
        _openid: app.globalData.openid,
        state: false,
        time: _.lt(todyStamp)
      }).skip(anytimeCount).limit(10).orderBy('createTime', 'desc').get({
        success(res) {
          callback()
          let todoList = res.data;
          todoList.map(item => {
            item.dateText = self.getDateText(item.time, item.notice);
            let workAreaList = self.data.workAreaList;
            workAreaList.map(part => {
              if (part._id == item.wid) {
                item.partText = part.name
              }
            })
          })
          let item = self.data.timeInfo[1];
          item.todoList = anytimeCount ? item.todoList.concat(todoList) : todoList;
          item.more = item.todoList.length >= total ? false : true;
          app.timeInfo[1] = item;
          self.setData({
            ['timeInfo[' + 1 + ']']: item,
            anytimeCount: anytimeCount += 10,
          },()=>{
            setTimeout(() => {
              app.timeInfo[1].toggleDelay = false;
              self.setData({
                ['timeInfo[' + 1 + '].toggleDelay']: false
              })
            }, 1000 + item.todoList.length * 100)
          })
        },
        fail(err) {
          wx.showToast({
            title: '哎呀，网络断了～',
            icon:'none'
          })
          console.error(err)
        }
      })
    })
  },
  /**
   * 查看todo详情
   */
  showDetail(e){
    let todoIndex = e.detail.index;
    let timeIndex = e.detail.timeIndex;
    this.setData({
      ['timeInfo[' + timeIndex + '].todoList[' + todoIndex + '].show']:true,
      showAddBtn:false,
    })
  },
  importantChange(e){
    let timeIndex = e.detail.timeIndex; 
    let todoIndex = e.detail.todoIndex;
    let timeInfo = this.data.timeInfo;
    let todoItem = timeInfo[timeIndex].todoList[todoIndex];
    let important = todoItem.important?false:true;
    app.timeInfo[timeIndex].todoList[todoIndex].important=important;
    this.setData({
      ['timeInfo[' + timeIndex + "].todoList[" + todoIndex + "].important"]:important,
    })
  },
  changeCheckOut(e){
    let timeIndex = e.detail.timeIndex; 
    let todoIndex = e.detail.todoIndex;
    let timeInfo = this.data.timeInfo;
    let todoItem = timeInfo[timeIndex].todoList[todoIndex];
    let todoId = todoItem._id;
    var state =  todoItem.state;
    let workAreaList = this.data.workAreaList;
    var checkTimeout = setTimeout(() => {
      let todoList = this.data.timeInfo[timeIndex].todoList;
      let Index = null; 
      let getWorkArea_Data = null;
      todoList.map((todo,index)=>{
        if (todoId == todo._id && todo.state){
          Index = index; 
        }
      })
      if (Index === null){
        return
      }
      //倒计时结束，执行删除
      todoList.splice(Index, 1);
      //处理workAreaList
      workAreaList.map((workItem,index)=>{
        for (var i = 0; i < workItem.todoList.length; i++){
          if (workItem.todoList[i]._id == todoItem._id){
            workItem.todoList.splice(i,1)
            workItem.count -= 1;
            if(workItem.todoList.length<workItem.count){
              getWorkArea_Data={
                wid:workItem._id,
                workItemIndex:index
              }
            }
            /**
            * 如果todolist少于4，检查是否有其他数据
            */
          }
        }
      })

      app.workAreaList = workAreaList;
      app.timeInfo[timeIndex].todoList = todoList;
      app.initHomeData(()=>{
        if(getWorkArea_Data){
          app.getWorkAreaList(getWorkArea_Data)
          getWorkArea_Data = null;
        }
      })
      /**
      * 修改数据后处理翻页问题
      */
      const todo = db.collection('todo');
      todo.doc(todoId).update({
        data:{
          state: true,
          finishTime:new Date().getTime()
        }
      }).then(res=>{
      }).catch(err=>{
        if(app.loading){
          app.loading(false)
        }
        console.error(err)
      })
    }, 3000)
    this.setData({
      ['timeInfo[' + timeIndex + "].todoList[" + todoIndex + "].state"]: !state,
      checkTimeout,
    })
  },
  del(data){
    let workAreaList = this.data.workAreaList;
    let todoList = app.timeInfo[data.timeIndex].todoList;
    let getWorkArea_Data = null;
    let todoId = data.todoItem._id;
    todoList.splice(data.todoIndex,1)
    workAreaList.map((workItem ,index)=> {
      for (var i = 0; i < workItem.todoList.length; i++) {
        if(workItem.todoList[i]._id==data.todoItem._id){
          workItem.todoList.splice(i,1)
          workItem.count-=1;
          if(workItem.todoList.length<workItem.count){
            getWorkArea_Data={
              wid:workItem._id,
              workItemIndex:index
            }
          }
        }
      }
    })
    db.collection('todo').where({
      _id:todoId
    }).remove()
    .then(res=>{
      console.log('删除成功',res)
      app.workAreaList= workAreaList;
      app.timeInfo[data.timeIndex].todoList = todoList;
      app.initHomeData(()=>{
        if(getWorkArea_Data){
          app.getWorkAreaList(getWorkArea_Data)
          getWorkArea_Data = null;
        }
      })
      this.setData({
        workAreaList,
        ['timeInfo['+data.timeIndex+'].todoList']:todoList
      })
      this.drag.init()
    }).catch(err=>{
      console.log(err)
      wx.showToast({
        title: '哎呀，网络好像断啦～',
        icon:'none'
      })
    })
    
    /**
     * 修改数据后处理翻页问题
     */
  },
  unShowDetail(e){
    let type = e.detail.type;
    let timeIndex = e.detail.timeIndex;
    let todoItem = e.detail.item;
    let todoIndex = e.detail.index;
    let timeStamp = todoItem.time;
    let workAreaList = this.data.workAreaList;
    let timeInfo = this.data.timeInfo;
    let getWorkArea_Data = null;
    if(type=='del'){
      this.del({todoItem,timeIndex,todoIndex,})
      return
    }
    if (todoItem.state){
      var getWorkArea_Data2 = null;
      workAreaList.map((workItem,index)=>{
        for (var i = 0; i < workItem.todoList.length; i++){
          if (workItem.todoList[i]._id == todoItem._id){
            workItem.todoList.splice(i,1)
            workItem.count -= 1;
            if(workItem.todoList.length<workItem.count){
              getWorkArea_Data2={
                wid:workItem._id,
                workItemIndex:index
              }
            }
          }
        }
      })
      timeInfo[timeIndex].todoList.splice(todoIndex, 1)
      app.timeInfo[timeIndex].todoList = timeInfo[timeIndex].todoList
      app.workAreaList = workAreaList;
      app.initHomeData(()=>{
        if(getWorkArea_Data2){
          app.getWorkAreaList(getWorkArea_Data2)
          getWorkArea_Data2 = null;
          this.setData({
            ['timeInfo['+ timeIndex + '].todoList']: timeInfo[timeIndex].todoList
          })
        }
      })
      return
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
    let todyStamp = this.getTime(0).timeStamp;
    let tomorrow = this.getTime(1).timeStamp;
    let new_timeIndex = null;
    let dateText = '';
    var check = time => {
      if (time < 10) {
        return '0' + time
      } else {
        return time
      }
    }
    if (timeStamp >= todyStamp && timeStamp < tomorrow) {//今天
      new_timeIndex = 0;
      if (todoItem.notice){
        var time = new Date(timeStamp);
        var hours = check(time.getHours());
        var min = check(time.getMinutes());
        dateText =  hours + ':' + min; 
      }else{
        dateText = '';
      }
    } else if (timeStamp < todyStamp || !timeStamp) {//随时
      new_timeIndex = 1;
      if (!timeStamp) {
        dateText = '';
      } else {
        dateText = '逾期';
      }
    } else {//计划
      new_timeIndex = 2;
      if (timeStamp >= tomorrow && timeStamp < tomorrow + 86400000) {
        dateText = '明天';
      }else{
        var date = new Date(timeStamp);
        var y = date.getFullYear(); // 获取完整的年份(4位,1970)
        var m = check(date.getMonth() + 1); // 获取月份(0-11,0代表1月,用的时候记得加上1)
        var d = check(date.getDate()); // 获取日(1-31)
        dateText = m + '月' + d + '日';
      }
    }
    todoItem.show = false;
    todoItem.dateText = dateText;
    workAreaList.map((workItem,index) => {
      if (todoItem.wid == workItem._id){
        if(workItem.todoList.length==0){//没有数据,直接添加
          workItem.todoList.push(todoItem)
          workItem.count +=1;
        }else{
          // 找到旧数据，在原区域旧直接替换
          for (var i = 0; i < workItem.todoList.length; i++) {
            if (workItem.todoList[i]._id == todoItem._id) {
              workItem.todoList.splice(i, 1, todoItem)//删除旧todo
              break
            } else if (i+1 == workItem.todoList.length){
              //循环结束，未发现旧数据
              //在其他区域找到就 按时间排序，取前四个
              function verb(arr) {
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
              workItem.todoList.push(todoItem)
              workItem.todoList = verb(workItem.todoList);
              workItem.todoList = workItem.todoList.slice(0, 4);
              workItem.count +=1;
              break
            }
          }
        }
      }else{
        //删除其他区域的旧数据
        for (var i = 0; i < workItem.todoList.length; i++) {
          if (workItem.todoList[i]._id == todoItem._id) {
            workItem.todoList.splice(i,1);
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
    app.timeInfo[timeIndex].todoList[todoIndex]=todoItem;
    app.workAreaList = workAreaList;
    app.initHomeData(()=>{
      if(getWorkArea_Data){
        app.getWorkAreaList(getWorkArea_Data)
        getWorkArea_Data = null;
      }
    })
    this.setData({
      workAreaList,
      ['timeInfo[' + timeIndex + '].todoList[' + todoIndex + ']']: todoItem,
      showAddBtn: true,
    },()=>{
      this.drag.init()
      if (timeIndex != new_timeIndex) {//时间区域发生变化
        setTimeout(() => {
          let new_timeInfo = this.data.timeInfo;
          new_timeInfo[timeIndex].todoList.splice(todoIndex, 1)
          new_timeInfo[new_timeIndex].todoList.push(todoItem);
          app.timeInfo[timeIndex].todoList = new_timeInfo[timeIndex].todoList;
          app.timeInfo[new_timeIndex].todoList = timeSort(new_timeInfo[new_timeIndex].todoList)
          this.setData({
            ['timeInfo[' + timeIndex + '].todoList']: new_timeInfo[timeIndex].todoList,
            ['timeInfo[' + new_timeIndex + '].todoList']: timeSort(new_timeInfo[new_timeIndex].todoList)
          })
        }, 500)
      }
    })

  },
  /**
   * 获取中文日期
   */
  getDateText(timeStamp,notice){
    var check = time => {
      if (time < 10) {
        return '0' + time
      } else {
        return time
      }
    }
    let todyStamp = this.getTime(0).timeStamp;
    let tomorrow = this.getTime(1).timeStamp;
    if (timeStamp >= todyStamp && timeStamp < tomorrow){
      if (!notice) {
        return ''
      }
      var time = new Date(timeStamp);
      var hours = check(time.getHours());
      var min = check(time.getMinutes());
      return hours+':'+min; 
    } else if (timeStamp >= tomorrow && timeStamp < tomorrow + 86400000){
      return '明天'
    } else if (timeStamp < todyStamp && timeStamp!=0){
      return '逾期'
    } else if (timeStamp == 0){
      return ''
    }else{
      var date = new Date(timeStamp);
      var y = date.getFullYear(); // 获取完整的年份(4位,1970)
      var m = check(date.getMonth() + 1); // 获取月份(0-11,0代表1月,用的时候记得加上1)
      var d = check(date.getDate()); // 获取日(1-31)
      return m + '月' + d + '日';
    }
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
   * 处理拖拽排序
   */
  sortEnd(e) {
    console.log("拖拽结束", e.detail.listData)
    //遍历位置
    let workAreaList = e.detail.listData;
    wx.cloud.callFunction({
      name: 'updateWorkArea',
      data:{
        workAreaList
      },
      success:res=>{
        console.log('云函数回调', res.result)
      },
      fail: err => {
        console.error('[云函数] [workArea] 调用失败', err)
      }
    })
    app.workAreaList=workAreaList;
		this.setData({ workAreaList });
	},
	change(e) {
    console.log("change", e.detail.listData)
	},
  loadMore(e){
    let type = e.detail.type;
    if(type == '今天'){
      this.getToday()
      wx.showToast({
        title: '你太难了...',
        icon:'none'
      })
    } else if (type == '随时') {
      this.getAnyTime()
    } else if (type == '计划'){
      this.getSomeDay()
    }
  },
  showQrcode() {
    wx.previewImage({
      urls: ['cloud://ztodo-e0maf.7a74-ztodo-e0maf-1302392035/qr/2871592280823_.pic_hd-2.jpg'],
      current: 'cloud://ztodo-e0maf.7a74-ztodo-e0maf-1302392035/qr/2871592280823_.pic_hd-2.jpg' // 当前显示图片的http链接      
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(){
    let self=this;
    self.drag = this.selectComponent('#drag');
    app.loading = loading =>{
      this.setData({loading})
    }
    app.loginCallback = userInfo => {
      console.log('成功获取用户信息', userInfo)
      this.setData({
        userInfo
      },()=>{
        this.setData({laoding:true})
        this.getWorkArea(()=>{
          this.getTodo(()=>{
            this.drag.init()
          })
        })
        let finish=0;
        this.getToday(()=>{
          finish+=1;
          if(finish== 3){
            app.loading(false)
            console.log('数据加载结束')
          }
        })
        this.getAnyTime(()=>{
          finish+=1;
          if(finish== 3){
            app.loading(false)
            console.log('数据加载结束')
          }
        })
        this.getSomeDay(()=>{
          finish+=1;
          if(finish== 3){
            app.loading(false)
            console.log('数据加载结束')
          }
        })
      })
    }
    app.initHomeData=(callback)=>{
      this.setData({
        workAreaList:app.workAreaList,
        timeInfo:app.timeInfo
      },()=>{
        this.drag.init();
        if(callback){
          callback()
        }
      })
      
    }
    app.getWorkAreaList=(data)=>{
      let index = data.workItemIndex;
      db.collection('todo').where({
        wid:data.wid,
        state:false
      }).limit(4)
      .orderBy('createTime', 'desc')
      .get()
      .then((res)=>{
        console.log(res)
        app.workAreaList[index].todoList = res.data;
        this.setData({
          ["workAreaList["+index+"].todoList"]:res.data
        })
        this.drag.init();
      })
      .catch(err=>{
        if(app.loading){
          app.loading(false)
        }
        console.log(err)
      })
    }
  },
  checkUserErr(){
    console.log('检查登录状态')
    if(this.data.checkuser){
      return
    }
    this.setData({
      checkuser:true
    })
    clearTimeout(this.data.timer)
    let timer = setTimeout(()=>{
      if(app.userInfo && !app.workAreaList){
        console.log('检查登录不正常，启动重置')
        app.onGetOpenid()
      }else{
        console.log('登录正常')
      }
      this.setData({
        checkuser:false
      })
    },3000)
    this.setData({
      timer
    })
  },
  onShow(){
    this.setData({
      userInfo:global.userInfo,
      workAreaList:app.workAreaList?app.workAreaList:[],
      timeInfo:app.timeInfo
    },()=>{
      if(app.timeInfo){
        this.drag.init();
      }
    })
    this.checkUserErr()
  },
  /**
   * 页面下拉
   */
  onPullDownRefresh(){
  },
  /**
   * 监听页面滚动
   */
  onPageScroll(e){
    
  },
  /**
   * 分享
   */
  onShareAppMessage () {
    // return custom share data when user share.
  },
})