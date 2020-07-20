// component/timeBox.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    item:Object,
    timeIndex:Number,
  },
  options: {
    addGlobalClass: true,
    multipleSlots: true,
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
    scroll(e){
      // this.triggerEvent('scroll', { scroll:e.detail.scroll });
    }, 
    showDetail(e){
      let index = e.detail.index;
      this.triggerEvent('showDetail', { timeIndex:this.data.timeIndex,index});
    },
    unShowDetail(e){
      let index = e.detail.index;
      let item = e.detail.item;
      let type = e.detail.type;
      this.triggerEvent('unShowDetail', { timeIndex: this.data.timeIndex, index, item,type});
    },
    
    loadMore(){
      this.triggerEvent('loadMore', { type: this.data.item.name });
    },
    changeCheckOut(e){
      let todoIndex = e.detail.todoIndex;
      this.triggerEvent('changeCheckOut', { timeIndex: this.data.timeIndex, todoIndex });
    },
    importantChange(e){
      let todoIndex = e.detail.todoIndex;
      this.triggerEvent('importantChange', { timeIndex: this.data.timeIndex, todoIndex });
    },
  },
  
})
