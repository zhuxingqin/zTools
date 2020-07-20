const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
export const api = function (params = {}) {
  return new Promise((resolve, reject)=>{
    const workArea = db.collection('workArea');
    workArea.where({
      _openid: app.globalData.openid
    }).orderBy('sort','desc').get({
      success: res => {
        resolve(res.data)
      },
      fail: err => {
        reject(err)
        console.error('查询记录失败')
      }
    })
  })
}