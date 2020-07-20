import { VantComponent } from '../vant/common/component';
import { transition } from '../vant/mixins/transition';
import { safeArea } from '../vant/mixins/safe-area';
const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
VantComponent({
  options:{
    addGlobalClass: true,
  },
  classes: [
    'enter-class',
    'enter-active-class',
    'enter-to-class',
    'leave-class',
    'leave-active-class',
    'leave-to-class'
  ],
  mixins: [transition(false), safeArea()],
  props: {
    transition: {
      type: String,
      observer: 'observeClass'
    },
    customStyle: String,
    overlayStyle: {
      type: String,
      value: 'background-color: rgba(0, 0, 0, .5);',
    },
    zIndex: {
      type: Number,
      value: 100
    },
    overlay: {
      type: Boolean,
      value: true
    },
    closeOnClickOverlay: {
      type: Boolean,
      value: true
    },
    position: {
      type: String,
      value: 'top',
      observer: 'observeClass'
    },
    wid:{
      value: null,
      type: String,
    },
    wname:{
      value: null,
      type: String,
    }
  },
  data: {
    check: false,
    list: [],
    focusList: null,
    CustomBar: app.globalData.CustomBar,
    showPartList: false,
    partList: [],
    showTimePicker: false,
    note: '',
    title: '',
    workAreaItem:null,
    important:false,
    timeObj: {
      time: null,
      noticeText: null,
      dateText: null,
      noticeTime: null,
      formId: null,
    }
  },
  created() {
    this.observeClass();
    //获取wid
    // app.getDailyId = ({wid,isHome}) => {
    //   console.log('wid',wid)
    //   this.setData({
    //     wid,
    //     workAreaItem:{name:options.wname}
    //   })
    // };
  },
  methods: {
    touchmove(){return},
    important(){
      this.setData({
        important:!this.data.important
      })
    },
    checkText(item,callback){
      if(item.title.trim() == ''){
        wx.showToast({
          title: '标题必须填写哦～',
          icon:'none',
        })
        return
      }
      if(callback){
        callback()
      }
    },
    save() { 
      let self = this;
      const todo = db.collection('todo');
      let time =0;
      if(this.data.timeObj.dateText == "今天"){
        time = Number(this.data.timeObj.time)?Number(this.data.timeObj.time) + Number(this.data.timeObj.noticeTime):Number(this.getTime(0).timeStamp)+Number(this.data.timeObj.noticeTime);
      }else{
        time = Number(this.data.timeObj.time)
      }
      var wid = this.data.wid;
      var partText = this.data.wname;
      if(this.data.workAreaItem){
        wid=this.data.workAreaItem._id;
        partText = this.data.workAreaItem.name;
      }
      let item ={
        createTime: new Date().getTime(),
        wid,
        title: this.data.title,
        note: this.data.note,
        state: this.data.check,
        formId: this.data.timeObj.formId,
        time,
        list:this.data.list,
        notice: this.data.timeObj.noticeText ? true : false,
        important:this.data.important
      }
      this.checkText(item,()=>{
        //处理home页面数据
        let timeStamp = time;
        let todyStamp = this.getTime(0).timeStamp;
        let tomorrow = this.getTime(1).timeStamp;
        let index = null;
        if (timeStamp >= todyStamp && timeStamp < tomorrow) {//今天
          index=0;
        } else if (timeStamp < todyStamp || !timeStamp) {//随时
          index=1;
        } else {//计划
          index=2;
        }
        let wordareaIndex = app.workAreaList.findIndex(t=>t._id == item.wid)
        todo.add({
          data: item,
          success: function (res) {
            console.log(res)
            item.partText = partText;
            item._id = res._id;
            item.dateText= self.getDateText(self.data.timeObj.time,item.notice);
            // item.dateText=self.data.timeObj.noticeText?self.data.timeObj.noticeText:'';
            self.clear()
            app.timeInfo[index].todoList.unshift(item);
            app.workAreaList[wordareaIndex].todoList.unshift(item);
            app.workAreaList[wordareaIndex].count += 1;
            app.initHomeData()
            if(app.initWorkareaPageData){
              app.initWorkareaPageData()
            }
          },
          fail:(err)=>{
            console.log('添加失败',err)
            wx.showToast({
              title: '网络信号不好呢，等会再试一次吧。😭',
              icon:'none',
            })
          }
        })
        this.triggerEvent('close');
      })
    },
    /**
     * 获取中文日期
     */
    getDateText(timeStamp,notice){
      console.log(timeStamp)
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
      } else if (!timeStamp || timeStamp==0){
        return ''
      }else{
        var date = new Date(timeStamp);
        var y = date.getFullYear(); // 获取完整的年份(4位,1970)
        var m = check(date.getMonth() + 1); // 获取月份(0-11,0代表1月,用的时候记得加上1)
        var d = check(date.getDate()); // 获取日(1-31)
        return m + '月' + d + '日';
      }
    },
    clear(){
      this.setData({
        title: '',
        note: '',
        check: false,
        list:[],
        important:false,
        ['timeObj.time']:null,
        ['timeObj.noticeText']:null,
        ['timeObj.dateText']:null,
        ['timeObj.noticeTime']:null,
        ['timeObj.formId']:null,
      })
    },
    titleInp(e) {
      this.setData({
        title: e.detail.value
      })
    },
    noteInp(e) {
      this.setData({
        note: e.detail.value
      })
    },
    selectedPart(e) {
      this.setData({
        workAreaItem: e.detail,
        wid: e.detail._id,
      })
    },
    selectedTime(e) {
      console.log(e.detail)
      this.setData({
        timeObj: e.detail
      })
    },
    addList() {
      let list = this.data.list;
      list.push({
        state: false,
        content: ''
      })
      this.setData({
        list,
        focusList: list.length - 1,
      })
    },
    delItem(e){
      let index = e.currentTarget.dataset.index;
      let list = JSON.parse(JSON.stringify(this.data.list)) ;
      list.splice(index,1);
      this.setData({
        list
      })
    },
    changeFocus(e) {
      this.setData({
        focusList: e.currentTarget.dataset.index
      })
    },
    itemInp(e){
      let index = e.currentTarget.dataset.index;
      let item = 'list[' + index + '].content';
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
      let list = this.data.list;
      let item = 'list[' + index + '].state';
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
      var page = getCurrentPages();
      if(page.length>1){
        if(this.data.animation){return}
        this.setData({animation:true})
        setTimeout(()=>{
          this.setData({animation:false})
        },500)
        return
      }
      this.setData({
        showPartList: true,
        wid:this.data.workAreaItem?this.data.workAreaItem._id:this.data.wid
      })
    },
    openTimePicker() {
      this.setData({
        showTimePicker: true,
      })
    },
    changeCheck() {
      this.setData({
        check: !this.data.check
      })
    },
    onClickOverlay() {
      this.$emit('click-overlay');
      if (this.data.closeOnClickOverlay) {
        this.$emit('close');
      }
    },
    observeClass() {
      const { transition, position } = this.data;
      const updateData = {
        name: transition || position
      };
      if (transition === 'none') {
        updateData.duration = 0;
      }
      this.set(updateData);
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
  },
});
