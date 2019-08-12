Component({
  options: {
    addGlobalClass: true,
  },
  data: {
    selected: 0,
    list: [ 
      {
        pagePath: "/pages/home/home/home",
        "iconPath": "home",
        "selectedIconPath": "homefill",
        "text": "首页"
      },
      {
        pagePath: "/pages/mine/mine/mine",
        "iconPath": "my",
        "selectedIconPath": "myfill",
        "text": "我的"
      },
    ]
  },
  methods: {
    switchTab(e) {      
      const data = e.currentTarget.dataset;
      const url = e.currentTarget.dataset.path;
      this.setData({
        selected:data.index
      })
      wx.switchTab({
        url
      })
      
    }
  },
  pageLifetimes: {
  },
})