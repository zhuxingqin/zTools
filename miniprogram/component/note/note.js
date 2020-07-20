// component/note/note.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    item:{
      type:Object
    }
  },
  options:{
    addGlobalClass:true
  },

  /**
   * 组件的初始数据
   */
  data: {
    colorPicker:false,
    colorList:[{
      showColor:'FFE654',
      realColor:'FFF7CC'
    },{
      showColor:'87F391',
      realColor:'DFFADE'
    },{
      showColor:'FFAAE2',
      realColor:'FFE3F2'
    },{
      showColor:'DFABFF',
      realColor:'F5E5FF'
    },{
      showColor:'8BE1FF',
      realColor:'DFF1FF'
    },{
      showColor:'E0E0E0',
      realColor:'F3F2F1'
    },{
      showColor:'767676',
      realColor:'696969'
    }]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    close(){
      this.setData({
        ['item.important']:false,
      })
      this.triggerEvent('notechange', {item:this.data.item});
    },
    colorChange(e){
      let color = e.target.dataset.color;
      this.setData({
        ['item.showColor']:color.showColor,
        ['item.realColor']:color.realColor,
        colorPicker:false
      })
      this.triggerEvent('notechange', {item:this.data.item});

    },  
    colorPicker(){
      this.setData({
        colorPicker:true
      })

    },
    blur(){
      this.triggerEvent('notechange', {item:this.data.item});
    },
    noteinp(e){
      let value = e.detail.value;
      this.setData({
        ["item.note"]:value
      })
    },
    clear(){
      this.setData({
        ['item.note']:''
      })
      this.triggerEvent('notechange', {item:this.data.item});
    },
  }
})
