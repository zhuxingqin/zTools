// miniprogram/pages/tools/calculator/calculator.js
const rnp=require('../../../database/rpn.js');
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    equation: '0',
    isDecimalAdded: false,
    isOperatorAdded: false,
    isStarted: false,
    CustomBar:app.globalData.CustomBar,
  },
  catchtouchmove(){return},
  // Check if the character is + / - / × / ÷
  isOperator(character) {
    return ['+', '-', '×', '÷'].indexOf(character) > -1
  },
  // When pressed Operators or Numbers
  append(e) {
    let character = e.target.dataset.data;
    wx.vibrateShort()
    // Start
    if (this.data.equation === '0' && !this.isOperator(character)) {
      if (character === '.') {
        this.setData({
          equation : this.data.equation+''+ character,
          isDecimalAdded : true
        })
        // this.data.equation += '' + character
        // this.data.isDecimalAdded = true
      } else {
        this.setData({
          equation : ''+ character,
        })
        // this.data.equation = '' + character
      }
      this.setData({
        isStarted : true,
      })
      // this.data.isStarted = true
      return
    }
    
    // If Number
    if (!this.isOperator(character)) {
      if (character === '.' && this.data.isDecimalAdded) {
        return
      }
      
      if (character === '.') {
        this.setData({
          isDecimalAdded:true,
          isOperatorAdded:true
        })
        // this.data.isDecimalAdded = true
        // this.data.isOperatorAdded = true
      } else {
        this.setData({
          isOperatorAdded:false
        })
        // this.data.isOperatorAdded = false
      }
      this.setData({
        equation:this.data.equation+''+character
      })
      // this.data.equation += '' + character
    }
    
    // Added Operator
    if (this.isOperator(character) && !this.data.isOperatorAdded) {
      this.setData({
        equation:this.data.equation+''+character,
        isDecimalAdded:false,
        isOperatorAdded:true
      })
      // this.data.equation += '' + character
      // this.data.isDecimalAdded = false
      // this.data.isOperatorAdded = true
    }
  },
  // When pressed '='
  calculate() {
    wx.vibrateShort()
    let result = this.data.equation.replace(new RegExp('×', 'g'), '*').replace(new RegExp('÷', 'g'), '/')
    let count = parseFloat(rnp.calCommonExp(result).toFixed(9)).toString();
    this.setData({
      equation:count=="NaN"?"错误":count,
      isDecimalAdded:false,
      isOperatorAdded:false
    })
    // this.data.equation = parseFloat(eval(result).toFixed(9)).toString()
    // this.data.isDecimalAdded = false
    // this.data.isOperatorAdded = false
  },
  // When pressed '+/-'
  calculateToggle() {
    wx.vibrateShort()
    if (this.data.isOperatorAdded || !this.data.isStarted) {
      return
    }
    this.setData({
      equation:this.data.equation + '* -1'
    })
    // this.data.equation = this.data.equation + '* -1'
    this.calculate()
  },
  // When pressed '%'
  calculatePercentage() {
    wx.vibrateShort()
    if (this.data.isOperatorAdded || !this.data.isStarted) {
      return
    }
    this.setData({
      equation:this.data.equation + '* 0.01'
    })
    // this.data.equation = this.data.equation + '* 0.01'
    this.calculate()
  },
  // When pressed 'AC'
  clear() {
    wx.vibrateShort()
    this.setData({
      equation:'0',
      isDecimalAdded : false,
      isOperatorAdded : false,
      isStarted : false
    })
    // this.data.equation = '0'
    // this.data.isDecimalAdded = false
    // this.data.isOperatorAdded = false
    // this.data.isStarted = false
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})