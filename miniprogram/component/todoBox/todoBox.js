// component/todoBox/todoBox.js
const app = getApp();
const global = getApp().globalData;
const db = wx.cloud.database();
const _ = db.command;
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    index:{
      type:Number,
      value:null,
    },
    toggleDelay:{
      type:Boolean,
      value:true,
    },
    item:{
      type:Object,
      value: {}
    }
  },
  options: {
    addGlobalClass: true,
  },
  /**
   * 组件的初始数据
   */
  data: {
    timeObj: {
      dateText: null,
      noticeTime: null,
      noticeText: null,
      formId: null,
      time: null,
    },
    modalName:false,
    CustomBar: app.globalData.CustomBar
  },
  /**
   * 组件的方法列表
   */
  methods: {
    touchstart: function(e) {
      this.startTime = e.timeStamp;
    },
    touchend: function(e) {
      this.endTime = e.timeStamp;
    },
    important(e){
      let type = e.target.dataset.type;
      let item = this.data.item;
      let important = item.important?false:true;
      item.important = important;
      if(type=='show'){
        this.setData({item})
        return
      }
      this.triggerEvent('importantChange', { todoIndex: this.data.index ,todoId:item._id});
      const todo = db.collection('todo');
      todo.doc(item._id).update({
        data: {
          important
        },
      }).then(res => {
        console.log('更新成功',res)
      }).catch(err => {
        console.error(err)
      })
    },
    delbefor(){
      if(this.data.confirm){
        this.setData({
          confirm:false
        })
        return
      }
      this.del()
    },
    del(){
      let self = this;
      if(self.data.confirm){
        // let todo = db.collection('todo');
        // todo.doc(self.data.item._id).remove({
        //   success(res){
        //     self.unShowDetail('del')
        //     console.log(res)
        //   }
        // })
        self.unShowDetail('del')
      }
      this.setData({
        confirm:!self.data.confirm
      })
    },
    // // ListTouch触摸开始
    // ListTouchStart(e) {
    //   this.setData({
    //     ListTouchStart: e.touches[0].pageX
    //   })
    // },
    // // ListTouch计算方向
    // ListTouchMove(e) {
    //   this.setData({
    //     ListTouchDirection: e.touches[0].pageX - this.data.ListTouchStart > 0 ? 'right' : 'left'
    //   })
    // },
    // // ListTouch计算滚动
    // ListTouchEnd(e) {
    //   if (this.data.ListTouchDirection == 'left') {
    //     this.setData({
    //       modalName: true
    //     })
    //   } else {
    //     this.setData({
    //       modalName: false
    //     })
    //   }
    //   this.setData({
    //     ListTouchDirection: null
    //   })
    // },
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
    setTime(){
      var timeStamp = this.data.item.time;
      var check = time => {
        if (time < 10) {
          return '0' + time
        } else {
          return time
        }
      }
      let todyStamp = this.getTime(0).timeStamp;
      let tomorrow = this.getTime(1).timeStamp;
      var date = new Date(timeStamp);
      if (!timeStamp) {
        var dateText = '';
      }else if (timeStamp >= todyStamp && timeStamp < todyStamp + 86399999) {
        var dateText = '今天';
      }else{
        var y = date.getFullYear(); // 获取完整的年份(4位,1970)
        var m = check(date.getMonth() + 1); // 获取月份(0-11,0代表1月,用的时候记得加上1)
        var d = check(date.getDate()); // 获取日(1-31)
        var dateText = y + '-' + m + '-' + d;
      }
      if(this.data.item.notice){
        var hours = check(date.getHours());
        var min = check(date.getMinutes());
        var noticeText = hours + ':' + min;
        var arr = noticeText.split(':');
        var noticeTime = parseInt(arr[0]) * 60 * 60 * 1000;
        noticeTime += parseInt(arr[1]) * 60 * 1000;

      }else{
        var noticeText = null;
        var noticeTime = null;
      }
      this.setData({
        timeObj: {
          dateText,
          formId: null,
          noticeText,
          noticeTime,
          time: timeStamp - noticeTime,
        }
      })
    },
    showDetail(e){
      if(this.endTime  - this.startTime >= 350)return
      // let homeScroll = app.homeScroll?app.homeScroll:0;
      // let pageY=e.changedTouches[0].pageY;
      // let CustomBar = this.data.CustomBar +70;
      // console.log(homeScroll,pageY,CustomBar)
      //获取滚动条距离
      //获取元素与页面顶部的距离
      //高度差 = 滚动条距离 - 元素与页面顶部的距离 - 头部刘海
      // let scroll = homeScroll + pageY - CustomBar;
      if(this.data.item.show){return}
      wx.vibrateShort()
      this.data.item.show = true;
      this.setData({
        oldItem: this.data.item,
        // lastHomeScroll : homeScroll
      })
      // this.triggerEvent('scroll', { scroll });
      this.triggerEvent('showDetail', { index: this.data.index });
      this.setTime()
      console.log('in')
    },
    unShowDetail(type) {
      if(this.endTime  - this.startTime >= 350)return
      // app.unShowDetail({ index: this.data.index, item: this.data.item })
      this.triggerEvent('scroll', { scroll:this.data.lastHomeScroll });
      if(type != 'del'){
        function isObj(object) {
          return object && typeof (object) == 'object' && Object.prototype.toString.call(object).toLowerCase() == "[object object]";
        }
        function isArray(object) {
          return object && typeof (object) == 'object' && object.constructor == Array;
        }
        function getLength(object) {
          var count = 0;
          for (var i in object) count++;
          return count;
        }
        function Compare(objA, objB) {
          if (!isObj(objA) || !isObj(objB)) return false; //判断类型是否正确
          if (getLength(objA) != getLength(objB)) return false; //判断长度是否一致
          return CompareObj(objA, objB, true);//默认为true
        }
        function CompareObj(objA, objB, flag) {
          for (var key in objA) {
            if (!flag) //跳出整个循环
              break;
              if (!objB.hasOwnProperty(key)) {
                flag = false; break;
              }
            if (!isArray(objA[key])) { //子级不是数组时,比较属性值
              if (objB[key] != objA[key]) { 
                flag = false; 
                console.log(objB[key],objA[key])
                break; 
              }
            } else {
              if (!isArray(objB[key])) { 
                flag = false; 
                break;
              }
              var oA = objA[key], oB = objB[key];
              if (oA.length != oB.length) { 
                flag = false; 
                break; 
              }
              for (var k in oA) {
                if (!flag){ //这里跳出循环是为了不让递归继续
                  break;
                }
                flag = CompareObj(oA[k], oB[k], flag);
              }
            }
          }
          return flag;
        }
        var result = Compare(this.data.item, this.data.oldItem);
        // console.log(result); // true or false
        if(!result){
          this.updateTodo()
        }
      }
      this.setData({
        confirm:false,
        style:''
      })
      this.triggerEvent('unShowDetail', { index: this.data.index, item: this.data.item,type});
    },
    updateTodo() {
      let item = this.data.item;
      const todo = db.collection('todo');
      todo.doc(item._id).update({
        data: {
          formId: item.formId,
          list: item.list,
          note: item.note,
          notice: item.notice,
          state: item.state,
          time: item.time,
          title: item.title,
          wid: item.wid,
          finishTime:item.state?new Date().getTime():null
        },
      }).then(res => {
        console.log(res)
      }).catch(err => {
        console.error(err)
      })
    },
    updateDatabase(){

    },
    titleInp(e) {
      this.setData({
        'item.title': e.detail.value
      })
    },
    noteInp(e) {
      this.setData({
        'item.note': e.detail.value
      })
    },
    selectedPart(e) {
      this.setData({
        'item.wid': e.detail._id,
        'item.partText':e.detail.name
      })
    },
    selectedTime(e) {
      this.setData({
        timeObj: e.detail,
        "item.time": e.detail.time + e.detail.noticeTime,
        "item.notice": e.detail.noticeText?true:false,
      })
    },
    addList() {
      let list = this.data.item.list;
      list.push({
        state: false,
        content: ''
      })
      this.setData({
        'item.list':list,
        focusList: list.length - 1,
      })
      this.toggle()
    },
    delItem(e) {
      let index = e.currentTarget.dataset.index;
      let list = JSON.parse(JSON.stringify(this.data.item.list));
      list.splice(index, 1);
      this.setData({
        'item.list':list
      })
    },
    changeFocus(e) {
      this.setData({
        focusList: e.currentTarget.dataset.index
      })
    },
    itemInp(e) {
      let index = e.currentTarget.dataset.index;
      let item = 'item.list[' + index + '].content';
      this.setData({
        [item]: e.detail.value
      })
    },
    blurFocus() {
      this.setData({
        focusList: null,
      })
    },
    changeListCheck(e) {
      let index = e.currentTarget.dataset.index;
      let list = this.data.item.list;
      let item = 'item.list[' + index + '].state';
      let state = !list[index].state;
      this.setData({
        [item]: state
      })
    },
    closePartList() {
      this.setData({
        showPartList: false
      })
    },
    closeTimePicker() {
      this.setData({
        showTimePicker: false
      })
    },
    openPartList() {
      this.setData({
        showPartList: true,
      })
    },
    openTimePicker() {
      this.setData({
        showTimePicker: true,
      })
    },
    changeCheckOut(){
      this.triggerEvent('changeCheckOut', { todoIndex: this.data.index ,todoId:this.data.item._id});
    },
    changeCheck() {
      this.setData({
        "item.state": !this.data.item.state
      })
    },
    toggle(e) {
      var that = this;
      that.setData({
        animation: 'animation-slide-right'
      })
      setTimeout(function () {
        that.setData({
          animation: ''
        })
      }, 1000)
    },
  },
  onShareAppMessage(e) {
    console.log(e)
    let item = e.target && e.target.dataset && e.target.dataset.item || {};
    return {
      title: item,
      // imageUrl: info.cover,
      path: 'pages/index/index' + (info.id ? ('?id=' + info.id)  : '')
    }
  }
})
