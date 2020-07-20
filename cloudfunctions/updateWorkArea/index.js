// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db=cloud.database();
const _ = db.command
const workArea = db.collection('workArea');
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let workAreaList=event.workAreaList;
  console.log('workAreaList',workAreaList)
  var promise = Promise.all(workAreaList.map((item,index)=>{
    return new Promise((resolve, reject)=>{
      workArea.where({
        _openid: wxContext.OPENID,
        _id:item._id
      })
      .update({
        data:{
          sort:workAreaList.length-index
        }
      })
      .then(res => {
        console.log('单个workArea更新成功',res)
        resolve(item)
      })
      .catch(()=>{
        console.error
        reject()
      })
    })
  }))
  promise.then(workAreaList=>{
    console.log('全部更新成功',workAreaList)
  }).catch(err=>{
    console.error(err)
  })
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}